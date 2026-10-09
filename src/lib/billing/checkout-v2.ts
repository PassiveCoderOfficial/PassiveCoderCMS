/**
 * Pricing v2 checkout (development / platform / care / bundle). Called by
 * /api/billing/checkout when the request carries `kind`. The amount always
 * comes from lib/pricing quote(), never from the client.
 */
import { NextResponse } from "next/server";
import { recordCheckout } from "@/lib/billing/activate";
import { makePayment, resolveSpConfig } from "@/lib/billing/shurjopay";
import { getDodoClient, resolveDodoConfig, resolveCustomerName } from "@/lib/billing/dodo";
import { CARE_COLUMNS, DEV_COLUMNS, formatAmount, quote, type CarePlan, type DevPackage, type Quote, type QuoteKind } from "@/lib/pricing/catalog";
import type { createAdminClient } from "@/lib/supabase/server";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;
const MANUAL_METHODS = ["bkash", "nagad", "bank"];
const KINDS: QuoteKind[] = ["development", "platform", "care", "bundle"];

export interface CheckoutV2Args {
  tenantId: string;
  kind: QuoteKind;
  method: string;
  txnRef?: string;
  senderNumber?: string;
  planId: string | null;
  careId: string | null;
  careCycle: "monthly" | "yearly";
  returnUrlOverride?: string;
  cancelUrlOverride?: string;
}

export async function checkoutV2(
  req: Request,
  admin: Admin,
  user: { id: string; email?: string; user_metadata: Record<string, unknown> },
  a: CheckoutV2Args,
) {
  if (!KINDS.includes(a.kind)) return NextResponse.json({ error: "Unknown checkout kind" }, { status: 400 });

  const [{ data: sub }, { data: ps }] = await Promise.all([
    admin.from("subscriptions").select("plan_id").eq("tenant_id", a.tenantId).maybeSingle(),
    admin.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  // Platform renewal is for the package the site is already on.
  const pkgId = a.kind === "platform" ? (a.planId ?? ((sub?.plan_id as string | null) ?? null)) : a.planId;
  const needsPkg = a.kind !== "care";
  const needsCare = a.kind === "care" || a.kind === "bundle";
  if (needsPkg && !pkgId) return NextResponse.json({ error: "Choose a package" }, { status: 400 });
  if (needsCare && !a.careId) return NextResponse.json({ error: "Choose a Care plan" }, { status: 400 });

  const pkgRes = pkgId
    ? await admin.from("plans")
        .select(`${DEV_COLUMNS}, dodo_dev_product_id, dodo_dev_product_id_sandbox, dodo_renewal_product_id, dodo_renewal_product_id_sandbox`)
        .eq("id", pkgId).maybeSingle()
    : { data: null };
  const careRes = a.careId
    ? await admin.from("care_plans")
        .select(`${CARE_COLUMNS}, dodo_monthly_product_id, dodo_monthly_product_id_sandbox, dodo_yearly_product_id, dodo_yearly_product_id_sandbox`)
        .eq("id", a.careId).eq("is_active", true).maybeSingle()
    : { data: null };
  const pkg = pkgRes.data as (DevPackage & Record<string, unknown>) | null;
  const care = careRes.data as (CarePlan & Record<string, unknown>) | null;
  if (needsPkg && !pkg?.dev_price_bdt) return NextResponse.json({ error: "Package not found" }, { status: 404 });
  if (needsCare && !care) return NextResponse.json({ error: "Care plan not found" }, { status: 404 });

  const manual = MANUAL_METHODS.includes(a.method);
  const currency = a.method === "dodo" ? "USD" : "BDT";
  let q: Quote;
  try {
    q = quote({ kind: a.kind, currency, pkg, care, careCycle: a.careCycle });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid checkout" }, { status: 400 });
  }

  const title = [pkg?.name, care?.name].filter(Boolean).join(" + ");
  const summary = q.lines.map((l) => `${l.label}: ${formatAmount(l.value, currency)}`).join("\n");
  const record = (extra: { payment_provider: string; shurjopay_order_id?: string; manual_ticket_id?: string }) =>
    recordCheckout(admin, a.tenantId, {
      plan_id: (pkgId ?? (sub?.plan_id as string | null) ?? "basic") as string,
      billing_cycle: "yearly",
      amount_cents: q.total,
      currency,
      kind: a.kind as "development" | "platform" | "care" | "bundle",
      care_plan_id: a.careId,
      care_cycle: a.kind === "care" ? a.careCycle : a.kind === "bundle" ? "yearly" : null,
      ...extra,
    });

  if (manual) {
    const { data: tenant } = await admin.from("tenants").select("name, slug").eq("id", a.tenantId).maybeSingle();
    const { data: ticket, error: ticketErr } = await admin.from("support_tickets").insert({
      tenant_id: a.tenantId,
      user_id: user.id,
      subject: `Manual payment: ${a.kind} (${title}, ${a.method})`,
      body:
        `Site: ${tenant?.name ?? a.tenantId} (${tenant?.slug ?? ""})\n${summary}\n` +
        `Total: ${formatAmount(q.total, currency)}\nMethod: ${a.method}\n` +
        `Sender number: ${a.senderNumber ?? "-"}\nTransaction ref: ${a.txnRef ?? "-"}\n\nAwaiting super-admin verification.`,
      department: "billing",
      priority: "high",
      status: "open",
      source: "site_admin",
    }).select("id").single();
    if (ticketErr) return NextResponse.json({ error: ticketErr.message }, { status: 500 });
    const { error } = await record({ payment_provider: "manual", manual_ticket_id: ticket.id });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true, mode: "manual", ticketId: ticket.id, quote: q });
  }

  const psRow = ps as Record<string, unknown> | null;
  const origin = new URL(req.url).origin;

  if (a.method === "shurjopay") {
    const spConfig = resolveSpConfig(psRow);
    if (!spConfig.sandbox && !spConfig.username) {
      return NextResponse.json({ error: "shurjoPay live credentials not configured" }, { status: 400 });
    }
    try {
      const { checkoutUrl, spOrderId } = await makePayment({
        amount: q.total,
        orderId: `v2_${a.kind.slice(0, 3)}_${a.tenantId.slice(0, 8)}_${Date.now()}`,
        currency: "BDT",
        returnUrl: `${origin}/api/billing/shurjopay/callback`,
        cancelUrl: a.cancelUrlOverride || `${origin}/dashboard/subscription?cancelled=1`,
        customerName: user.email ?? "Customer",
        customerEmail: user.email ?? undefined,
        config: spConfig,
      });
      const { error } = await record({ payment_provider: "shurjopay", shurjopay_order_id: spOrderId });
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ ok: true, mode: "shurjopay", checkoutUrl, quote: q });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Payment init failed" }, { status: 502 });
    }
  }

  if (a.method === "dodo") {
    const dodoConfig = resolveDodoConfig(psRow);
    if (!dodoConfig.apiKey) return NextResponse.json({ error: "Dodo API key not configured" }, { status: 400 });
    if (a.kind === "bundle") {
      return NextResponse.json(
        { error: "The website + Care bundle is paid by bank, bKash or shurjoPay. By card, buy the website and Care separately." },
        { status: 400 },
      );
    }
    const sb = dodoConfig.sandbox ? "_sandbox" : "";
    const productId = (
      a.kind === "development" ? pkg?.[`dodo_dev_product_id${sb}`]
      : a.kind === "platform" ? pkg?.[`dodo_renewal_product_id${sb}`]
      : care?.[`dodo_${a.careCycle}_product_id${sb}`]
    ) as string | null | undefined;
    if (!productId) {
      return NextResponse.json(
        { error: `Card payment for this item is not set up yet (${dodoConfig.sandbox ? "sandbox" : "live"}). Pay by bank or bKash, or message us on WhatsApp.` },
        { status: 400 },
      );
    }
    const customerName = await resolveCustomerName(admin, user as never);
    try {
      const session = await getDodoClient({ apiKey: dodoConfig.apiKey, sandbox: dodoConfig.sandbox }).checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email!, name: customerName },
        return_url: a.returnUrlOverride || `${origin}/dashboard/subscription?paid=1`,
        cancel_url: a.cancelUrlOverride || `${origin}/dashboard/subscription?cancelled=1`,
        metadata: { tenant_id: a.tenantId, kind: a.kind, plan_id: pkgId ?? "", care_plan_id: a.careId ?? "", care_cycle: a.careCycle },
        feature_flags: { redirect_immediately: true },
      });
      const { error } = await record({ payment_provider: "dodo" });
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ ok: true, mode: "dodo", checkoutUrl: session.checkout_url, quote: q });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Dodo payment init failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unknown payment method" }, { status: 400 });
}
