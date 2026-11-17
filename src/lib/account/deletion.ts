import type { User } from "@supabase/supabase-js";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/**
 * User account deletion (Google Play requires an in-app path because the app
 * has signup). Flow:
 *  1. status(): blockers (sites the user owns, super admin / staff, partner
 *     money history) must be cleared first.
 *  2. request(): password (or typed email for Google-only accounts) checked,
 *     row in account_deletion_requests, scheduled GRACE_DAYS ahead; the
 *     request time goes into app_metadata so a later sign-in can cancel it.
 *  3. cancelOnSignIn(): called by the dashboard layout and the app bootstrap;
 *     a sign-in after the request cancels it (free check: app_metadata).
 *  4. runDue() (cron): re-checks blockers, clears no-action FKs, deletes the
 *     auth user (profile, memberships, devices, addresses... cascade; pages,
 *     orders, tickets, contacts keep their rows with the user set to null),
 *     then wipes the email from the request row.
 */

export const GRACE_DAYS = 14;
type Admin = Awaited<ReturnType<typeof createAdminClient>>;

export type DeletionBlocker =
  | { kind: "site"; id: string; name: string; slug: string }
  | { kind: "super_admin" }
  | { kind: "staff" }
  | { kind: "partner_balance" };

export type DeletionStatus = {
  blockers: DeletionBlocker[];
  pending: { requested_at: string; scheduled_for: string } | null;
  needs_password: boolean;
  grace_days: number;
};


/** True when the user can sign in with a password (else confirm by typing the email). */
export function hasPassword(user: User): boolean {
  return (user.identities ?? []).some((i) => i.provider === "email") || user.app_metadata?.provider === "email";
}

export async function blockersFor(admin: Admin, userId: string): Promise<DeletionBlocker[]> {
  const out: DeletionBlocker[] = [];
  const [{ data: owned }, { data: ownerRows }, { data: sa }, { data: staff }, { data: partner }] = await Promise.all([
    admin.from("tenants").select("id, name, slug").eq("owner_id", userId),
    admin.from("tenant_members").select("tenant_id, tenants(id, name, slug)").eq("user_id", userId).eq("role", "owner"),
    admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("pc_staff").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("partners").select("id").eq("user_id", userId).maybeSingle(),
  ]);
  const seen = new Set<string>();
  for (const t of owned ?? []) {
    seen.add(t.id as string);
    out.push({ kind: "site", id: t.id as string, name: (t.name as string) ?? t.slug, slug: t.slug as string });
  }
  for (const r of ownerRows ?? []) {
    const t = (Array.isArray(r.tenants) ? r.tenants[0] : r.tenants) as { id: string; name: string; slug: string } | null;
    if (!t || seen.has(t.id)) continue;
    seen.add(t.id);
    out.push({ kind: "site", id: t.id, name: t.name ?? t.slug, slug: t.slug });
  }
  if (sa) out.push({ kind: "super_admin" });
  if (staff) out.push({ kind: "staff" });
  if (partner?.id) {
    // Commission/credit history is money we must keep; support closes it by hand.
    const { count } = await admin.from("partner_credit_moves").select("id", { count: "exact", head: true }).eq("partner_id", partner.id);
    if ((count ?? 0) > 0) out.push({ kind: "partner_balance" });
  }
  return out;
}

async function openRequest(admin: Admin, userId: string) {
  const { data } = await admin
    .from("account_deletion_requests")
    .select("id, requested_at, scheduled_for")
    .eq("user_id", userId)
    .is("cancelled_at", null)
    .is("completed_at", null)
    .maybeSingle();
  return data as { id: string; requested_at: string; scheduled_for: string } | null;
}

export async function deletionStatus(user: User): Promise<DeletionStatus> {
  const admin = await createAdminClient();
  const [blockers, pending] = await Promise.all([blockersFor(admin, user.id), openRequest(admin, user.id)]);
  return {
    blockers,
    pending: pending ? { requested_at: pending.requested_at, scheduled_for: pending.scheduled_for } : null,
    needs_password: hasPassword(user),
    grace_days: GRACE_DAYS,
  };
}

async function passwordOk(email: string, password: string): Promise<boolean> {
  const c = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;
  // Throw the extra session away (local scope: the user's other sessions stay).
  await c.auth.signOut({ scope: "local" }).catch(() => {});
  return true;
}

export type RequestResult =
  | { ok: true; scheduled_for: string }
  | { ok: false; status: number; error: string; blockers?: DeletionBlocker[] };

export async function requestDeletion(
  user: User,
  input: { password?: string; confirm_email?: string; reason?: string; source?: string },
): Promise<RequestResult> {
  const admin = await createAdminClient();
  const email = user.email ?? "";
  const blockers = await blockersFor(admin, user.id);
  if (blockers.length) return { ok: false, status: 409, error: "blocked", blockers };

  if (hasPassword(user)) {
    if (!input.password || !(await passwordOk(email, input.password))) {
      return { ok: false, status: 403, error: "wrong_password" };
    }
  } else if ((input.confirm_email ?? "").trim().toLowerCase() !== email.toLowerCase()) {
    return { ok: false, status: 403, error: "email_mismatch" };
  }

  const existing = await openRequest(admin, user.id);
  if (existing) return { ok: true, scheduled_for: existing.scheduled_for };

  // Stamp after the password check: that check is itself a sign-in, and a
  // sign-in later than requested_at is what cancels the request.
  const requestedAt = new Date(Date.now() + 1000);
  const scheduled = new Date(requestedAt.getTime() + GRACE_DAYS * 864e5);
  const { error } = await admin.from("account_deletion_requests").insert({
    user_id: user.id,
    email,
    source: input.source === "app" ? "app" : "web",
    reason: input.reason?.slice(0, 500) || null,
    requested_at: requestedAt.toISOString(),
    scheduled_for: scheduled.toISOString(),
  });
  if (error) return { ok: false, status: 500, error: error.message };
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...(user.app_metadata ?? {}), deletion_requested_at: requestedAt.toISOString() },
  });

  const when = scheduled.toUTCString().slice(0, 16);
  await sendEmail({
    to: email,
    subject: "Your Passive Coder account will be deleted",
    text:
      `We received a request to delete your Passive Coder account (${email}).\n\n` +
      `It will be deleted on ${when}. Until then you can cancel by simply signing in again ` +
      `(web dashboard or the Passive Coder Admin app).\n\n` +
      `If you did not ask for this, sign in now and change your password.\n\nPassive Coder`,
  }).catch(() => {});
  return { ok: true, scheduled_for: scheduled.toISOString() };
}

/** Explicit cancel (signed-in user tapping "Keep my account"). */
export async function cancelDeletion(user: User): Promise<boolean> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("account_deletion_requests")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("cancelled_at", null)
    .is("completed_at", null)
    .select("id");
  if (user.app_metadata?.deletion_requested_at) {
    await admin.auth.admin.updateUserById(user.id, { app_metadata: { deletion_requested_at: null } });
  }
  return (data?.length ?? 0) > 0;
}

/**
 * Cancel a pending deletion when the user signed in after asking for it.
 * Costs nothing for everyone else (reads the user object already loaded).
 */
export async function cancelOnSignIn(user: User | null): Promise<boolean> {
  const at = user?.app_metadata?.deletion_requested_at as string | undefined;
  if (!user || !at || !user.last_sign_in_at) return false;
  if (new Date(user.last_sign_in_at).getTime() <= new Date(at).getTime()) return false;
  return cancelDeletion(user);
}

/** Cron: delete every account whose grace period is over. */
export async function runDueDeletions(limit = 25): Promise<{ done: number; skipped: number }> {
  const admin = await createAdminClient();
  const { data: due } = await admin
    .from("account_deletion_requests")
    .select("id, user_id, email")
    .is("cancelled_at", null)
    .is("completed_at", null)
    .lte("scheduled_for", new Date().toISOString())
    .limit(limit);
  let done = 0;
  let skipped = 0;
  for (const r of due ?? []) {
    const res = await deleteNow(admin, r.user_id as string);
    if (res.ok) {
      done++;
      await admin.from("account_deletion_requests")
        .update({ completed_at: new Date().toISOString(), email: null, error: null })
        .eq("id", r.id);
    } else {
      skipped++;
      await admin.from("account_deletion_requests").update({ error: res.error }).eq("id", r.id);
    }
  }
  return { done, skipped };
}

async function deleteNow(admin: Admin, userId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: u } = await admin.auth.admin.getUserById(userId);
  if (!u?.user) return { ok: true }; // already gone
  const blockers = await blockersFor(admin, userId);
  if (blockers.length) return { ok: false, error: `blocked: ${blockers.map((b) => b.kind).join(",")}` };

  // FKs with NO ACTION would stop the auth delete; keep the rows, drop the link.
  await admin.from("subscription_payments").update({ recorded_by: null }).eq("recorded_by", userId);
  await admin.from("agent_pending_actions").update({ resolved_by: null }).eq("resolved_by", userId);
  // profiles, memberships, devices, addresses, wishlists cascade with the auth
  // user; tickets, orders, pages, contacts and audit rows stay with user = null.

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
