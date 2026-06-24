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
 * Auto-create agent_commission entries for a payment.
 * - Referral agent: one-time commission on first payment only
 * - Staff agent: recurring commission on every payment
 */
export async function createCommissions({
  supabase,
  tenantId,
  paymentAmountCents,
  billingCycle,
  isFirstPayment,
}: CreateCommissionOpts) {
  // Load tenant agents and platform defaults in parallel
  const [{ data: tenant }, { data: settings }] = await Promise.all([
    supabase
      .from("tenants")
      .select("referred_by_agent_id, staff_agent_id, agent_commission_override, staff_commission_override")
      .eq("id", tenantId)
      .maybeSingle(),
    supabase.from("platform_settings").select("default_agent_one_time_pct, default_staff_recurring_pct").eq("id", 1).maybeSingle(),
  ]);

  if (!tenant) return;

  const defaultOneTime = settings?.default_agent_one_time_pct ?? 10;
  const defaultStaffRecurring = settings?.default_staff_recurring_pct ?? 10;
  const paymentAmount = paymentAmountCents / 100;
  const entries = [];

  // Referral agent: one-time on first payment only
  if (isFirstPayment && tenant.referred_by_agent_id) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id, one_time_pct_override, status")
      .eq("id", tenant.referred_by_agent_id)
      .maybeSingle();
    if (agent && agent.status === "active") {
      const pct = tenant.agent_commission_override ?? agent.one_time_pct_override ?? defaultOneTime;
      const amount = Math.round((paymentAmount * pct) / 100 * 100) / 100;
      entries.push({
        agent_id: agent.id,
        tenant_id: tenantId,
        amount,
        commission_type: "one_time",
        payment_amount: paymentAmount,
        billing_cycle: billingCycle,
        status: "pending",
        description: `One-time referral commission (${pct}% of $${paymentAmount.toFixed(2)})`,
      });
    }
  }

  // Staff agent: recurring on every payment
  if (tenant.staff_agent_id) {
    const { data: staff } = await supabase
      .from("agents")
      .select("id, is_staff, staff_recurring_pct, status")
      .eq("id", tenant.staff_agent_id)
      .maybeSingle();
    if (staff && staff.is_staff && staff.status === "active") {
      const pct = tenant.staff_commission_override ?? staff.staff_recurring_pct ?? defaultStaffRecurring;
      const amount = Math.round((paymentAmount * pct) / 100 * 100) / 100;
      entries.push({
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
  }

  if (entries.length) {
    await supabase.from("agent_commissions").insert(entries);
  }
}
