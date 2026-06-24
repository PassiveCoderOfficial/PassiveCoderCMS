import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/billing/shurjopay";
import { enmProvision } from "@/lib/enm";

import type { SupabaseClient } from "@supabase/supabase-js";

async function syncENM(admin: SupabaseClient, tenantId: string, tier: "free" | "pro") {
  const { data: tenant } = await admin.from("tenants").select("id, owner_id").eq("id", tenantId).maybeSingle();
  if (!tenant) return;
  const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", tenant.owner_id).maybeSingle();
  if (!profile?.email) return;
  const enmUserId = await enmProvision({ email: profile.email, name: profile.full_name ?? undefined, pcTenantId: tenantId, tier });
  await admin.from("tenants").update({ enm_user_id: enmUserId, enm_tier: tier }).eq("id", tenantId);
}

// shurjoPay redirects the customer here after payment with ?order_id=<sp_order_id>.
async function handle(req: Request, orderId: string | null) {
  const origin = new URL(req.url).origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/dashboard/subscription?error=${encodeURIComponent(reason)}`);

  if (!orderId) return fail("missing_order");

  const admin = await createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, tenant_id, plan_id")
    .eq("shurjopay_order_id", orderId)
    .maybeSingle();
  if (!sub) return fail("subscription_not_found");

  const { ok } = await verifyPayment(orderId);
  if (!ok) return fail("payment_not_verified");

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await admin.from("subscriptions").update({
    status: "active",
    trial_converted: true,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  }).eq("id", sub.id);

  await admin.from("tenants").update({ status: "active", plan: sub.plan_id }).eq("id", sub.tenant_id);

  // Sync ENM tier (best-effort — don't block on failure)
  const enmTier = sub.plan_id === "pro" ? "pro" : "free";
  syncENM(admin, sub.tenant_id, enmTier).catch(err => console.error("[ENM sync shurjopay]", err));

  return NextResponse.redirect(`${origin}/dashboard/subscription?paid=1`);
}

export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("order_id");
  return handle(req, orderId);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let orderId = url.searchParams.get("order_id");
  if (!orderId) {
    try {
      const form = await req.formData();
      orderId = (form.get("order_id") as string) ?? null;
    } catch { /* ignore */ }
  }
  return handle(req, orderId);
}
