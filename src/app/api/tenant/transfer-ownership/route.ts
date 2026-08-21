import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { transferTenantOwnership } from "@/lib/tenant/transfer-ownership";
import { canTransferTenant } from "@/lib/tenant/can-transfer";

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
  const {
    tenantId, email, password, fullName,
    requirePasswordChange, resetExistingPassword, previousOwner,
  } = body as {
    tenantId?: string; email?: string; password?: string; fullName?: string;
    requirePasswordChange?: boolean; resetExistingPassword?: boolean;
    previousOwner?: "demote" | "remove";
  };

  if (!tenantId || !email) {
    return NextResponse.json({ error: "Missing site or email" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const authorized = await canTransferTenant(admin, user.id, tenantId);
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
    resetExistingPassword,
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

  return NextResponse.json({
    ok: true,
    created: result.created,
    passwordSet: result.passwordSet,
    userId: result.userId,
  });
}
