import type { SupabaseClient } from "@supabase/supabase-js";
import { canActOnUser } from "@/lib/super-admin";
import { ROOT_TENANT_SLUG } from "@/lib/flags";
import { finishAdminAudit, startAdminAudit } from "@/lib/mcp/admin-scope";
import { transferAuthority } from "@/lib/tenant/can-transfer";
import { transferTenantOwnership, type TransferInput, type TransferResult } from "@/lib/tenant/transfer-ownership";
import { ROOT_SITE_REFUSAL, transferAuditArgs, transferRefusal } from "@/lib/tenant/transfer-rules";

/**
 * The one way a site changes owner, for every surface: the panel, the staff site
 * list, the tenant Users page, the phone app and MCP (transfer_site_ownership, and
 * add_site_member or create_user with role owner). Authorization, the limits on
 * anyone but a super admin, the audit rows and the ownership writes live here so
 * they can't drift.
 *
 * Manager transfers write admin_audit_log BEFORE anything changes and stop if that
 * row can't be written. startAdminAudit is what auditPanelWrite wraps; called
 * directly because this row needs its id (to record the outcome) and the right
 * surface in `via`.
 */
export async function transferSite(
  admin: SupabaseClient,
  actorId: string,
  via: "web" | "app" | "mcp",
  input: TransferInput,
): Promise<TransferResult> {
  const { tenantId, email } = input;
  const authority = await transferAuthority(admin, actorId, tenantId);
  if (!authority) return { ok: false, error: "You don't have permission to transfer this site", status: 403 };

  const { data: site } = await admin.from("tenants").select("name, slug, owner_id").eq("id", tenantId).maybeSingle();
  const previousOwner = input.previousOwner ?? "demote";
  const toEmail = email.trim().toLowerCase();
  let auditId: string | null = null;

  const facts = (over: { newOwnerId: string | null; accountCreated: boolean; credentialsSet: boolean }) => transferAuditArgs({
    siteName: (site?.name as string | undefined) ?? null,
    siteSlug: (site?.slug as string | undefined) ?? null,
    oldOwnerId: (site?.owner_id as string | null | undefined) ?? null,
    toEmail, previousOwner, actorId, ...over,
  });

  /** A refused attempt is worth a row too, but can't be what stops it: it is already stopped. */
  const logRefusal = async (error: string, targetUserId: string | null, resetsPassword: boolean) => {
    try {
      const id = await startAdminAudit(admin, {
        actorUserId: actorId, action: "site.transfer_ownership", tenantId, targetUserId, via,
        args: facts({ newOwnerId: targetUserId, accountCreated: false, credentialsSet: resetsPassword }),
      });
      await finishAdminAudit(admin, id, false, error);
    } catch (e) {
      console.error("[transfer-ownership] could not log a refused transfer", e);
    }
  };

  // A transfer to your own account never changes your own password: doing so
  // signs you out everywhere with whatever was typed in the transfer form.
  if (input.password && input.resetExistingPassword) {
    const { data: actor } = await admin.auth.admin.getUserById(actorId);
    if (actor?.user?.email?.toLowerCase() === toEmail) {
      const error = "You can't change your own password through a site transfer. Leave the password empty.";
      await logRefusal(error, actorId, false);
      return { ok: false, error, status: 400 };
    }
  }

  if (authority !== "super_admin" && site?.slug === ROOT_TENANT_SLUG) {
    await logRefusal(ROOT_SITE_REFUSAL, null, false);
    return { ok: false, error: ROOT_SITE_REFUSAL, status: 403 };
  }

  const result = await transferTenantOwnership(admin, input, authority === "super_admin" ? undefined : async (plan) => {
    const owners = await Promise.all(plan.currentOwnerIds.map((id) => canActOnUser(actorId, id)));
    const refusal = transferRefusal(authority, {
      isRootSite: false, // refused above
      resetsExistingPassword: plan.resetsExistingPassword,
      targetIsProtected: plan.targetUserId ? !(await canActOnUser(actorId, plan.targetUserId)) : false,
      previousOwner,
      currentOwnerIsProtected: owners.includes(false),
    });
    if (refusal) {
      await logRefusal(refusal.error, plan.targetUserId, plan.resetsExistingPassword);
      return refusal;
    }
    if (authority !== "manager") return null;
    try {
      auditId = await startAdminAudit(admin, {
        actorUserId: actorId, action: "site.transfer_ownership", tenantId, targetUserId: plan.targetUserId, via,
        args: facts({ newOwnerId: plan.targetUserId, accountCreated: plan.createsAccount, credentialsSet: plan.setsPassword }),
      });
      return null;
    } catch (e) {
      return { error: `Not transferred: ${e instanceof Error ? e.message : "audit log unavailable"}`, status: 503 };
    }
  });

  if (auditId) {
    if (result.ok) {
      // A new account's id only exists now. The row is already written, so a failure here loses detail, not the record.
      const { error } = await admin.from("admin_audit_log").update({
        ok: true,
        target_user_id: result.userId,
        after: facts({ newOwnerId: result.userId, accountCreated: result.created, credentialsSet: result.passwordSet }),
      }).eq("id", auditId);
      if (error) console.error("[transfer-ownership] could not finish the audit row", { auditId, error: error.message });
    } else {
      await finishAdminAudit(admin, auditId, false, result.error);
    }
  }
  if (!result.ok) return result;

  // Ownership changes are worth a durable record: this is the moment a site
  // stops belonging to the person who built it, and "who handed this over, to
  // whom, when" is exactly what gets asked months later in a dispute.
  const { error: historyErr } = await admin.from("tenant_ownership_transfers").insert({
    tenant_id: tenantId,
    from_user_id: site?.owner_id ?? null,
    to_user_id: result.userId,
    to_email: toEmail,
    performed_by: actorId,
    account_created: result.created,
    previous_owner_action: previousOwner,
  });
  // Never fail a completed transfer because this insert didn't land — the
  // ownership rows are already written and consistent by this point, and
  // reporting failure would invite a retry that then hits "already owns this
  // site". Surface it in logs instead.
  if (historyErr) {
    console.error("[transfer-ownership] history insert failed", { tenantId, to: result.userId, error: historyErr.message });
  }
  return result;
}
