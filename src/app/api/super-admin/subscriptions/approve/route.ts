import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { enmProvision } from "@/lib/enm";
import { createCommissions } from "@/lib/commissions";

// Super-admin approves a pending manual payment (bKash/Nagad/bank) and activates
// the subscription + tenant for one year.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subscriptionId } = await req.json();
  if (!subscriptionId) return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, tenant_id, plan_id, manual_ticket_id")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await admin.from("subscriptions").update({
    status: "active",
    trial_converted: true,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  }).eq("id", sub.id);

  await admin.from("tenants").update({ status: "active", plan: sub.plan_id }).eq("id", sub.tenant_id);

  if (sub.manual_ticket_id) {
    await admin.from("support_tickets").update({ status: "resolved", resolved_at: now.toISOString() }).eq("id", sub.manual_ticket_id);
  }

  // Create commission entries (best-effort)
  try {
    const { data: subFull } = await admin.from("subscriptions").select("amount_cents, custom_amount_cents, billing_cycle, trial_converted").eq("id", sub.id).maybeSingle();
    const amtCents = subFull?.custom_amount_cents ?? subFull?.amount_cents ?? 0;
    if (amtCents > 0) {
      await createCommissions({
        supabase: admin,
        tenantId: sub.tenant_id,
        paymentAmountCents: amtCents,
        billingCycle: subFull?.billing_cycle ?? "yearly",
        isFirstPayment: !subFull?.trial_converted,
      });
    }
  } catch (err) {
    console.error("[commissions approve]", err);
  }

  // Sync ENM tier (best-effort)
  const enmTier = sub.plan_id === "pro" ? "pro" : "free";
  const { data: tenant } = await admin.from("tenants").select("owner_id").eq("id", sub.tenant_id).maybeSingle();
  if (tenant) {
    const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", tenant.owner_id).maybeSingle();
    if (profile?.email) {
      enmProvision({ email: profile.email, name: profile.full_name ?? undefined, pcTenantId: sub.tenant_id, tier: enmTier })
        .then(uid => admin.from("tenants").update({ enm_user_id: uid, enm_tier: enmTier }).eq("id", sub.tenant_id))
        .catch(err => console.error("[ENM approve]", err));
    }
  }

  return NextResponse.json({ ok: true });
}
