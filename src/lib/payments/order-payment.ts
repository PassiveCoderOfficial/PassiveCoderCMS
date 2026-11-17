/**
 * Online (prepaid) payment for marketplace orders, through SSLCommerz.
 *
 * placeOrder() writes the order with payment_method 'online', payment_status
 * 'pending' and every sub-order awaiting_payment = true, so sellers don't see
 * it yet. startOrderPayment() opens a gateway session; confirmOrderPayment()
 * runs on the success POST and the IPN (whichever comes first) and, once the
 * payment validates, marks the order paid and releases the parcels to sellers
 * with the platform holding the money.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { getSslczConfig, initSession, paymentMatchesOrder, tranIdFor, validatePayment } from "./sslcommerz";

export const ONLINE_METHOD = "online";

export function originOf(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function onlinePaymentAvailable(tenantId: string): Promise<boolean> {
  return !!(await getSslczConfig(tenantId));
}

/** Open a payment session for an unpaid online order. */
export async function startOrderPayment(orderId: string, origin: string, tenantId?: string | null): Promise<{ url?: string; error?: string }> {
  const admin = await createAdminClient();
  let q = admin
    .from("orders")
    .select("id, tenant_id, order_number, status, total, payment_method, payment_status, customer_name, customer_email, shipping_address, items, payment_proof")
    .eq("id", orderId);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data: order } = await q.maybeSingle();
  if (!order) return { error: "Order not found" };
  if (order.payment_method !== ONLINE_METHOD) return { error: "This order is not paid online" };
  if (order.payment_status === "paid") return { error: "This order is already paid" };
  if (order.status === "cancelled") return { error: "This order was cancelled because it was not paid in time. Please place it again." };

  const cfg = await getSslczConfig(order.tenant_id);
  if (!cfg) return { error: "Online payment is not available right now" };

  const ship = (order.shipping_address ?? {}) as Record<string, string | null>;
  const items = (order.items ?? []) as { name?: string; quantity?: number }[];
  const email = order.customer_email && !String(order.customer_email).endsWith("@nomail.local") ? String(order.customer_email) : "";
  const tranId = tranIdFor(order.order_number);
  const base = `${origin}/api/payments/sslcommerz`;

  const r = await initSession(cfg, {
    tranId,
    amount: Number(order.total),
    currency: "BDT",
    successUrl: `${base}/success`,
    failUrl: `${base}/fail`,
    cancelUrl: `${base}/cancel`,
    ipnUrl: `${base}/ipn`,
    customer: {
      name: order.customer_name ?? ship.name ?? "Customer",
      email,
      phone: ship.phone ?? "",
      address: ship.address ?? "",
      city: ship.city ?? ship.area ?? "Dhaka",
    },
    productName: items.map((i) => i.name ?? "Item").join(", ").slice(0, 200) || `Order ${order.order_number}`,
    productCategory: "Marketplace",
    itemCount: items.reduce((s, i) => s + (i.quantity ?? 1), 0) || 1,
    valueA: order.id,
  });
  if (!r.ok || !r.url) return { error: r.error ?? "Could not start the payment" };

  const proof = (order.payment_proof ?? {}) as Record<string, unknown>;
  await admin
    .from("orders")
    .update({ payment_proof: { ...proof, gateway: "sslcommerz", tran_id: tranId, started_at: new Date().toISOString() } })
    .eq("id", order.id);
  return { url: r.url };
}

export interface ConfirmResult {
  orderId: string | null;
  paid: boolean;
  error?: string;
}

/**
 * Validate a payment reported by SSLCommerz and mark its order paid.
 * Idempotent: success redirect and IPN may both arrive.
 */
export async function confirmOrderPayment(fields: { val_id?: string | null; tran_id?: string | null; value_a?: string | null }): Promise<ConfirmResult> {
  const admin = await createAdminClient();
  const orderId = fields.value_a?.trim() || null;
  if (!orderId) return { orderId: null, paid: false, error: "Missing order" };

  const { data: order } = await admin
    .from("orders")
    .select("id, tenant_id, order_number, status, total, payment_method, payment_status, payment_proof")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { orderId: null, paid: false, error: "Order not found" };
  if (order.payment_status === "paid") return { orderId: order.id, paid: true };
  if (!fields.val_id) return { orderId: order.id, paid: false, error: "Payment not completed" };

  const cfg = await getSslczConfig(order.tenant_id);
  if (!cfg) return { orderId: order.id, paid: false, error: "Gateway not configured" };

  const v = await validatePayment(cfg, fields.val_id);
  if (!paymentMatchesOrder(v, { orderNumber: order.order_number, total: Number(order.total), currency: "BDT" })) {
    console.error("[sslcommerz] payment did not validate", { order: order.order_number, status: v.status, amount: v.amount, tran: v.tranId, error: v.error });
    return { orderId: order.id, paid: false, error: "Payment could not be verified" };
  }

  const proof = (order.payment_proof ?? {}) as Record<string, unknown>;
  // The order was auto-cancelled (unpaid for 24h) before this payment arrived.
  // Keep the money on record and flag it for a refund; never revive the order,
  // its stock and voucher use were already given back.
  const lateOnCancelled = order.status === "cancelled";
  const { data: updated } = await admin
    .from("orders")
    .update({
      ...(lateOnCancelled ? { flagged_reason: "Paid online after the order was auto-cancelled. Refund the customer." } : {}),
      payment_status: "paid",
      transaction_id: v.bankTranId || v.tranId || fields.val_id,
      payment_proof: {
        ...proof,
        gateway: "sslcommerz",
        tran_id: v.tranId,
        val_id: fields.val_id,
        bank_tran_id: v.bankTranId ?? null,
        card_type: v.cardType ?? null,
        risk_level: v.riskLevel ?? null,
        paid_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  // Paid online: the platform holds the money, nothing to collect at the door,
  // and sellers can now see and ship the parcels.
  if (updated && !lateOnCancelled) {
    await admin
      .from("sub_orders")
      .update({ money_holder: "platform", cod_amount: 0, awaiting_payment: false })
      .eq("order_id", order.id);
  }
  return { orderId: order.id, paid: true };
}

/** Plain result page for fail / cancel (and success when we can't verify). */
export function paymentResultPage(opts: { title: string; message: string; orderId: string | null; retry: boolean }): Response {
  const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
  const view = opts.orderId ? `/order-confirmation/${encodeURIComponent(opts.orderId)}` : "/";
  const retry = opts.orderId && opts.retry ? `/api/payments/sslcommerz/retry?order=${encodeURIComponent(opts.orderId)}` : null;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title>
<style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#F9FAFB;color:#1A1330;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
.c{background:#fff;border:1px solid #EAECF0;border-radius:16px;padding:28px;max-width:420px;width:100%;text-align:center}
h1{font-size:20px;margin:0 0 8px}p{color:#475467;font-size:14px;line-height:1.5;margin:0 0 20px}
a{display:block;text-decoration:none;font-weight:600;border-radius:12px;padding:12px;margin-top:10px;font-size:14px}
.p{background:#FF5A1F;color:#fff}.s{border:1px solid #EAECF0;color:#1A1330}</style></head>
<body><div class="c"><h1>${esc(opts.title)}</h1><p>${esc(opts.message)}</p>
${retry ? `<a class="p" href="${retry}">Try paying again</a>` : ""}<a class="s" href="${view}">View my order</a></div></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

/** Read SSLCommerz's form POST (or query string) into a plain object. */
export async function readGatewayFields(req: Request): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const url = new URL(req.url);
  url.searchParams.forEach((v, k) => { out[k] = v; });
  if (req.method === "POST") {
    try {
      const fd = await req.formData();
      fd.forEach((v, k) => { if (typeof v === "string") out[k] = v; });
    } catch { /* not a form body */ }
  }
  return out;
}
