import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { whiteLabelStatus } from "@/lib/partners/brand";
import { PC_CREDIT_BASE, partnerBase, planCanEditCredit, type CreditBase, type PartnerCreditRule } from "./footer-credit-shared";

export type CreditPolicy = { editable: boolean; base: CreditBase; partner: boolean };
const LOCKED: CreditPolicy = { editable: false, base: PC_CREDIT_BASE, partner: false };

/**
 * Server-side footer credit policy for a site. Never throws; any failure
 * falls back to the locked Passive Coder credit.
 *  - Direct site: Pro/Biz/Custom may hide/change; others show Passive Coder.
 *  - Partner site with ACTIVE white-label: the partner's default
 *    (partners.footer_credit) replaces Passive Coder's; Pro/Biz/Custom clients
 *    may override only when the partner allows it; Basic always gets the
 *    partner default. Inactive white-label = direct-site rules.
 */
export const creditPolicyFor = cache(async (tenantId: string | null | undefined): Promise<CreditPolicy> => {
  if (!tenantId) return LOCKED;
  try {
    const admin = await createAdminClient();
    const { data: t } = await admin.from("tenants").select("plan, reseller_partner_id").eq("id", tenantId).maybeSingle();
    const row = t as { plan?: string | null; reseller_partner_id?: string | null } | null;
    const planOk = planCanEditCredit(row?.plan);
    if (row?.reseller_partner_id) {
      const { data: p } = await admin.from("partners").select("id, type, status, white_label_until").eq("id", row.reseller_partner_id).maybeSingle();
      if (p && (await whiteLabelStatus(admin, p as never)).active) {
        // Own query: a database without migration 178 just has no partner rule.
        const { data: r, error } = await admin.from("partners").select("footer_credit").eq("id", row.reseller_partner_id).maybeSingle();
        const rule = error ? null : ((r as { footer_credit?: PartnerCreditRule | null } | null)?.footer_credit ?? null);
        return { editable: planOk && rule?.allowClients !== false, base: partnerBase(rule), partner: true };
      }
    }
    return { editable: planOk, base: PC_CREDIT_BASE, partner: false };
  } catch {
    return LOCKED;
  }
});

export async function creditEditableFor(tenantId: string | null | undefined): Promise<boolean> {
  return (await creditPolicyFor(tenantId)).editable;
}
