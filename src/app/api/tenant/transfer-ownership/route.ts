import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import { transferTenantOwnership } from "@/lib/tenant/transfer-ownership";

/**
 * Transfers a site to its client, optionally creating their account.
 *
 * One endpoint for all three callers (SA panel, staff, tenant admins) rather
 * than a route each: this changes who controls a customer's site, so the
 * authorization and the ownership writes should have exactly one
 * implementation to audit, not three that drift apart.
 *
 * Who may transfer:
 *   - super admins: any site
 *   - staff: only sites assigned to or referred by them, i.e. ones they built
 *   - tenant owner/admin: their own site
 * A staff member cannot transfer an arbitrary site by guessing its id, and a
 * tenant admin cannot reach another tenant's.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { tenantId, email, password, fullName, requirePasswordChange, previousOwner } = body as {
    tenantId?: string; email?: string; password?: string; fullName?: string;
    requirePasswordChange?: boolean; previousOwner?: "demote" | "remove";
  };

  if (!tenantId || !email) {
    return NextResponse.json({ error: "Missing site or email" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const authorized = await canTransfer(admin, user.id, tenantId);
  if (!authorized) {
    return NextResponse.json({ error: "You don't have permission to transfer this site" }, { status: 403 });
  }

  // Read the outgoing owner before the transfer overwrites it, so the audit
  // row can record what the site moved *from*.
  const { data: before } = await admin
    .from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();

  const result = await transferTenantOwnership(admin, {
    tenantId,
    email,
    password,
    fullName,
    requirePasswordChange,
    previousOwner,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Ownership changes are worth a durable record: this is the moment a site
  // stops belonging to the person who built it, and "who handed this over, to
  // whom, when" is exactly what gets asked months later in a dispute.
  const { error: auditErr } = await admin.from("tenant_ownership_transfers").insert({
    tenant_id: tenantId,
    from_user_id: before?.owner_id ?? null,
    to_user_id: result.userId,
    to_email: email.trim().toLowerCase(),
    performed_by: user.id,
    account_created: result.created,
    previous_owner_action: previousOwner ?? "demote",
  });
  // Never fail a completed transfer because the audit insert didn't land — the
  // ownership rows are already written and consistent by this point, and
  // reporting failure would invite a retry that then hits "already owns this
  // site". Surface it in logs instead.
  if (auditErr) {
    console.error("[transfer-ownership] audit insert failed", {
      tenantId, to: result.userId, error: auditErr.message,
    });
  }

  return NextResponse.json({ ok: true, created: result.created, userId: result.userId });
}

async function canTransfer(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  tenantId: string,
): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;

  const { data: membership } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (membership && ["owner", "admin"].includes(membership.role as string)) return true;

  // Staff may only hand over the sites they actually built.
  const { data: staffRow } = await admin
    .from("pc_staff").select("id").eq("user_id", userId).maybeSingle();
  if (!staffRow) return false;

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .or(`assigned_staff_id.eq.${staffRow.id},referred_by_staff_id.eq.${staffRow.id}`)
    .maybeSingle();

  return !!tenant;
}
