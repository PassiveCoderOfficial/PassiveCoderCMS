import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hands a site over to its real owner.
 *
 * The case this exists for: staff build a site under their own account, then
 * deliver it to the client. Until that happens the client has no access at all,
 * and staff remain the owner of a business they don't own.
 *
 * Ownership lives in TWO places and both must move together, or access breaks
 * in ways that are hard to diagnose:
 *   - `tenant_members` row with role "owner" — what most permission checks read
 *   - `tenants.owner_id` — what login-as, RLS fallbacks and several list views
 *     read directly without joining tenant_members
 * A transfer that updates one and not the other leaves a site the client can
 * see but not administer, or vice versa.
 */

export type TransferResult =
  | { ok: true; userId: string; created: boolean }
  | { ok: false; error: string; status: number };

export interface TransferInput {
  tenantId: string;
  email: string;
  /** Set to create the account when the email isn't registered yet. */
  password?: string;
  fullName?: string;
  /** Force a password change at first login. Off by default — see the route. */
  requirePasswordChange?: boolean;
  /** What happens to the person who currently owns the site. Demoting to admin
   *  keeps staff able to finish support work; removing cuts access entirely. */
  previousOwner?: "demote" | "remove";
}

/** Finds a user by email. auth.users has no direct email lookup through the JS
 *  client, so page through listUsers — infrequent, admin-only call. */
async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ id: string } | null | { error: string }> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { error: error.message };
    const match = data.users.find(u => u.email?.toLowerCase() === normalized);
    if (match) return { id: match.id };
    if (data.users.length < 200) break;
  }
  return null;
}

export async function transferTenantOwnership(
  admin: SupabaseClient,
  input: TransferInput,
): Promise<TransferResult> {
  const {
    tenantId, email, password, fullName,
    requirePasswordChange = false,
    previousOwner = "demote",
  } = input;

  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, error: "A valid email address is required", status: 400 };
  }

  const found = await findUserByEmail(admin, normalized);
  if (found && "error" in found) {
    return { ok: false, error: found.error, status: 500 };
  }

  let targetUserId: string;
  let created = false;

  if (found) {
    targetUserId = found.id;
  } else {
    if (!password) {
      return {
        ok: false,
        error: `No account exists for ${normalized}. Provide a password to create one.`,
        status: 404,
      };
    }
    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters", status: 400 };
    }

    // email_confirm skips the verification email — the whole point of this flow
    // is that the client can sign in immediately with credentials handed to
    // them directly, rather than waiting on an invite mail that often lands in
    // spam for a domain they've never received mail from.
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: true,
      user_metadata: {
        ...(fullName ? { full_name: fullName } : {}),
        ...(requirePasswordChange ? { must_change_password: true } : {}),
      },
    });
    if (createErr || !newUser?.user) {
      return { ok: false, error: createErr?.message ?? "Could not create the account", status: 500 };
    }
    targetUserId = newUser.user.id;
    created = true;

    // A profiles row normally comes from a signup trigger; upsert defensively
    // so the new owner still resolves in member lists if that never fired.
    await admin.from("profiles").upsert(
      { id: targetUserId, email: normalized, ...(fullName ? { full_name: fullName } : {}) },
      { onConflict: "id" },
    );
  }

  // Guard against handing a site to whoever already owns it — harmless in
  // effect, but it would demote them to admin on the way through and leave the
  // site with no owner at all.
  const { data: tenant } = await admin
    .from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();
  if (!tenant) return { ok: false, error: "Site not found", status: 404 };
  if (tenant.owner_id === targetUserId) {
    return { ok: false, error: "That user already owns this site", status: 400 };
  }

  // Order matters: demote the incumbent BEFORE promoting, so the tenant is
  // never momentarily left with two owners.
  if (previousOwner === "remove") {
    await admin.from("tenant_members")
      .delete().eq("tenant_id", tenantId).eq("role", "owner");
  } else {
    const { error: demoteErr } = await admin.from("tenant_members")
      .update({ role: "admin" }).eq("tenant_id", tenantId).eq("role", "owner");
    if (demoteErr) return { ok: false, error: demoteErr.message, status: 500 };
  }

  const { error: memberErr } = await admin.from("tenant_members").upsert(
    { tenant_id: tenantId, user_id: targetUserId, role: "owner", joined_at: new Date().toISOString() },
    { onConflict: "tenant_id,user_id" },
  );
  if (memberErr) return { ok: false, error: memberErr.message, status: 500 };

  const { error: ownerErr } = await admin
    .from("tenants").update({ owner_id: targetUserId }).eq("id", tenantId);
  if (ownerErr) return { ok: false, error: ownerErr.message, status: 500 };

  return { ok: true, userId: targetUserId, created };
}
