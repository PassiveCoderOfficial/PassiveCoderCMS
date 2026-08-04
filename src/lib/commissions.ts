import { createAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;

interface CreateCommissionOpts {
  supabase: AdminClient;
  tenantId: string;
  paymentAmountCents: number;
  billingCycle: string;
  isFirstPayment: boolean;
}

/**
 * Auto-create agent_commission entries for a payment. Recurring-only model —
 * a staff member assigned to a tenant (tenants.staff_agent_id) earns a % of
 * every payment that tenant makes, as long as platform_settings.
 * staff_commission_enabled is on (off by default). isFirstPayment is kept in
 * the signature for call-site compatibility but no longer changes behavior
 * here — the old one-time-on-first-payment referral tier was removed.
 */
export async function createCommissions({
  supabase,
  tenantId,
  paymentAmountCents,
  billingCycle,
}: CreateCommissionOpts) {
  const [{ data: tenant }, { data: settings }] = await Promise.all([
    supabase
      .from("tenants")
      .select("staff_agent_id, staff_commission_override")
      .eq("id", tenantId)
      .maybeSingle(),
    supabase.from("platform_settings").select("staff_commission_enabled, default_staff_recurring_pct").eq("id", 1).maybeSingle(),
  ]);

  if (!tenant || !tenant.staff_agent_id) return;
  if (!settings?.staff_commission_enabled) return;

  const defaultStaffRecurring = settings?.default_staff_recurring_pct ?? 10;
  const paymentAmount = paymentAmountCents / 100;

  const { data: staff } = await supabase
    .from("agents")
    .select("id, staff_recurring_pct, status")
    .eq("id", tenant.staff_agent_id)
    .maybeSingle();
  if (!staff || staff.status !== "active") return;

  const pct = tenant.staff_commission_override ?? staff.staff_recurring_pct ?? defaultStaffRecurring;
  const amount = Math.round((paymentAmount * pct) / 100 * 100) / 100;

  await supabase.from("agent_commissions").insert({
    agent_id: staff.id,
    tenant_id: tenantId,
    amount,
    commission_type: "recurring",
    payment_amount: paymentAmount,
    billing_cycle: billingCycle,
    status: "pending",
    description: `Staff recurring commission (${pct}% of $${paymentAmount.toFixed(2)})`,
  });
}
