import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import { resolvePayment, type PayCurrency } from "@/lib/billing/money";
import { createCommissions } from "@/lib/commissions";

async function authed() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null, user: null };
  if (!await isSuperAdmin(user.id)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), supabase: null, user: null };
  const supabase = await createAdminClient();
  return { error: null, supabase, user };
}

// GET ?subscription_id= → list payments for a subscription
export async function GET(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;
  const subId = new URL(req.url).searchParams.get("subscription_id");
  if (!subId) return NextResponse.json({ error: "Missing subscription_id" }, { status: 400 });
  const { data, error: dbErr } = await supabase!
    .from("subscription_payments")
    .select("*")
    .eq("subscription_id", subId)
    .order("paid_at", { ascending: false });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ payments: data ?? [] });
}

// POST — record a payment, recompute statement, optional commissions
export async function POST(req: Request) {
  const { error, supabase, user } = await authed();
  if (error) return error;
  const admin = supabase!;

  const body = await req.json() as {
    subscription_id?: string;
    currency?: string;
    orig_amount?: number | string;
    method?: string;
    paid_at?: string;
    note?: string;
    is_advance?: boolean;
  };

  const subId = body.subscription_id;
  const currency: PayCurrency = body.currency === "BDT" ? "BDT" : "USD";
  const origAmount = typeof body.orig_amount === "string" ? parseFloat(body.orig_amount) : (body.orig_amount ?? 0);
  if (!subId) return NextResponse.json({ error: "Missing subscription_id" }, { status: 400 });
  if (!origAmount || origAmount <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });

  // Load subscription + platform rate
  const [{ data: sub }, { data: ps }] = await Promise.all([
    admin.from("subscriptions").select("id, tenant_id, plan_id, billing_cycle, amount_cents, custom_amount_cents, discount_pct, total_billed_cents, current_period_end").eq("id", subId).maybeSingle(),
    admin.from("platform_settings").select("usd_to_bdt_rate").eq("id", 1).maybeSingle(),
  ]);
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  const rate: number = (ps as { usd_to_bdt_rate?: number } | null)?.usd_to_bdt_rate ?? 125;

  const { amountCents, origAmountMinor, fxRate } = resolvePayment(origAmount, currency, rate);

  // Generate receipt number
  const { data: rn, error: rnErr } = await admin.rpc("next_receipt_number");
  if (rnErr) return NextResponse.json({ error: rnErr.message }, { status: 500 });

  const paidAt = body.paid_at ? new Date(body.paid_at).toISOString() : new Date().toISOString();

  // Insert ledger row
  const { data: payment, error: insErr } = await admin.from("subscription_payments").insert({
    tenant_id: sub.tenant_id,
    subscription_id: subId,
    receipt_number: rn as string,
    amount_cents: amountCents,
    currency,
    orig_amount_minor: origAmountMinor,
    fx_rate: fxRate,
    method: body.method || null,
    paid_at: paidAt,
    is_advance: !!body.is_advance,
    note: body.note?.trim() || null,
    recorded_by: user!.id,
  }).select("*").single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Recompute statement totals from the ledger (source of truth)
  const { data: allPayments } = await admin
    .from("subscription_payments")
    .select("amount_cents")
    .eq("subscription_id", subId);
  const totalPaid = (allPayments ?? []).reduce((s, p) => s + (p.amount_cents ?? 0), 0);

  // Ensure total_billed_cents is set (default from plan/custom amount after discount)
  let totalBilled = sub.total_billed_cents;
  if (totalBilled == null) {
    const base = sub.custom_amount_cents ?? sub.amount_cents ?? 0;
    const disc = sub.discount_pct ? Number(sub.discount_pct) : 0;
    totalBilled = Math.round(base * (1 - disc / 100));
  }

  const fullyPaid = totalBilled > 0 && totalPaid >= totalBilled;
  const subUpdate: Record<string, unknown> = {
    total_paid_cents: totalPaid,
    total_billed_cents: totalBilled,
    last_paid_at: paidAt,
  };
  if (fullyPaid) {
    subUpdate.status = "active";
    subUpdate.trial_converted = true;
    if (!sub.current_period_end) {
      const end = new Date(paidAt);
      if (sub.billing_cycle === "monthly") end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);
      subUpdate.current_period_start = paidAt;
      subUpdate.current_period_end = end.toISOString();
    }
  }
  await admin.from("subscriptions").update(subUpdate).eq("id", subId);

  // Sync tenant status when fully paid
  if (fullyPaid) {
    await admin.from("tenants").update({ status: "active", plan: sub.plan_id }).eq("id", sub.tenant_id);
  }

  // Commissions (best-effort) — staff agent gets recurring on every payment.
  // isFirstPayment=false so only staff recurring fires (no referral one-time here).
  createCommissions({
    supabase: admin,
    tenantId: sub.tenant_id,
    paymentAmountCents: amountCents,
    billingCycle: sub.billing_cycle ?? "yearly",
    isFirstPayment: false,
  }).catch(err => console.error("[commissions record-payment]", err));

  return NextResponse.json({ ok: true, payment, totalPaid, totalBilled, balanceDue: Math.max(totalBilled - totalPaid, 0) });
}

// DELETE ?id= → void a payment, recompute totals
export async function DELETE(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;
  const admin = supabase!;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: payment } = await admin.from("subscription_payments").select("subscription_id").eq("id", id).maybeSingle();
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  await admin.from("subscription_payments").delete().eq("id", id);

  const { data: rest } = await admin.from("subscription_payments").select("amount_cents").eq("subscription_id", payment.subscription_id);
  const totalPaid = (rest ?? []).reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  await admin.from("subscriptions").update({ total_paid_cents: totalPaid }).eq("id", payment.subscription_id);

  return NextResponse.json({ ok: true, totalPaid });
}
