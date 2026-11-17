import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/couriers/fulfil";
import { applyCourierStatus } from "@/lib/couriers";

/**
 * Steadfast status callback. In the Steadfast panel the merchant sets this URL
 * and a Bearer token; ours is the account's webhook_token (shown on the
 * seller's Courier page), which is also how we find the account.
 * Payload: notification_type ('delivery_status' | 'tracking_update'),
 * consignment_id, invoice, status, cod_amount, delivery_charge,
 * tracking_message, updated_at.
 */
export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ status: "error", message: "Missing token" }, { status: 401 });
  const admin = await createAdminClient();
  const { data: acc } = await admin.from("vendor_courier_accounts").select("id, tenant_id, provider")
    .eq("webhook_token", token).eq("provider", "steadfast").maybeSingle();
  if (!acc) return NextResponse.json({ status: "error", message: "Unknown token" }, { status: 401 });

  const p = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!p) return NextResponse.json({ status: "error", message: "Bad JSON" }, { status: 400 });
  const cid = p.consignment_id != null ? String(p.consignment_id) : null;
  const invoice = typeof p.invoice === "string" ? p.invoice : null;

  let q = admin.from("sub_orders").select("id").eq("tenant_id", acc.tenant_id);
  q = cid ? q.eq("consignment_id", cid) : invoice ? q.eq("sub_order_number", invoice) : q.eq("id", "00000000-0000-0000-0000-000000000000");
  const { data: sub } = await q.limit(1).maybeSingle();
  // Unknown parcel: still 200 so Steadfast does not keep retrying.
  if (!sub) return NextResponse.json({ status: "success", message: "Webhook received successfully." });

  const kind = String(p.notification_type ?? "delivery_status");
  const status = kind === "tracking_update" ? null : (typeof p.status === "string" ? p.status : null);
  await applyCourierStatus(admin, sub.id, {
    provider: "steadfast", status,
    message: typeof p.tracking_message === "string" ? p.tracking_message : null,
    eventKey: `steadfast:${cid ?? invoice}:${kind}:${p.status ?? ""}:${p.updated_at ?? p.tracking_message ?? ""}`.slice(0, 300),
    source: "webhook", raw: p,
  }, requestOrigin(req));
  return NextResponse.json({ status: "success", message: "Webhook received successfully." });
}
