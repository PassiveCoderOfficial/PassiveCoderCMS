import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/couriers/fulfil";
import { applyCourierStatus } from "@/lib/couriers";

/**
 * Pathao webhook. In the Pathao merchant panel (Developer API > Webhook) the
 * merchant sets this URL and a secret; ours is the account's webhook_token,
 * which Pathao sends back in X-PATHAO-Signature.
 * Pathao's integration check expects 202 with the header
 * X-Pathao-Merchant-Webhook-Integration-Secret. Its value comes from the
 * account (integration_secret), else PATHAO_WEBHOOK_INTEGRATION_SECRET, else
 * the value Pathao's docs publish.
 * Events: order.created, order.picked, order.in-transit, order.delivered,
 * order.returned, order.delivery-failed, ... with consignment_id,
 * merchant_order_id, updated_at.
 */
const DEFAULT_INTEGRATION_SECRET = "f3992ecc-59da-4cbe-a049-a13da2018d51";

export async function POST(req: NextRequest) {
  const sig = (req.headers.get("x-pathao-signature") ?? "").trim();
  const admin = await createAdminClient();
  const { data: acc } = sig
    ? await admin.from("vendor_courier_accounts").select("id, tenant_id, integration_secret")
      .eq("webhook_token", sig).eq("provider", "pathao").maybeSingle()
    : { data: null };
  if (!acc) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const reply = () => NextResponse.json({ ok: true }, {
    status: 202,
    headers: { "X-Pathao-Merchant-Webhook-Integration-Secret": acc.integration_secret || process.env.PATHAO_WEBHOOK_INTEGRATION_SECRET || DEFAULT_INTEGRATION_SECRET },
  });

  const p = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const event = typeof p?.event === "string" ? p.event : null;
  const cid = p?.consignment_id != null ? String(p.consignment_id) : null;
  if (!p || !cid || !event || !event.startsWith("order.")) return reply(); // integration check, store events

  const { data: sub } = await admin.from("sub_orders").select("id").eq("tenant_id", acc.tenant_id).eq("consignment_id", cid).limit(1).maybeSingle();
  if (!sub) return reply();

  const status = event === "order.updated" ? null : event.replace(/^order\./, "");
  await applyCourierStatus(admin, sub.id, {
    provider: "pathao", status,
    message: typeof p.reason === "string" ? p.reason : null,
    eventKey: `pathao:${cid}:${event}:${p.updated_at ?? p.timestamp ?? ""}`.slice(0, 300),
    source: "webhook", raw: p,
  }, requestOrigin(req));
  return reply();
}
