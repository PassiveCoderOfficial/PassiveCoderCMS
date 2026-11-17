import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { tooMany, clientIp } from "@/lib/rate-limit";
import { isBlockedSender } from "@/lib/spam/guard";
import { requestOrigin } from "@/lib/couriers/fulfil";
import { refreshParcel } from "@/lib/couriers";

const REFRESH_EVERY_MS = 10 * 60_000;
const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-10);

/**
 * Parcel tracking for customers. Look up by order number + the phone on the
 * order (both must match), or by the order id from the confirmation page
 * (an unguessable uuid, the same trust as that page). Only that order's
 * parcels come back. Booked parcels not checked for 10 minutes are
 * refreshed from the courier first.
 */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const limited = tooMany(req, "track", 20);
  if (limited) return limited;

  const b = await req.json().catch(() => ({}));
  const id = typeof b.id === "string" && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : null;
  const orderNumber = typeof b.order_number === "string" ? b.order_number.trim().toUpperCase().slice(0, 40) : "";
  const phone = digits(b.phone);
  if (!id && (!orderNumber || phone.length < 10)) {
    return NextResponse.json({ error: "Enter your order number and the mobile number you ordered with" }, { status: 400 });
  }
  const notFound = NextResponse.json({ error: "No order matches that order number and mobile number" }, { status: 404 });
  if (!id && (await isBlockedSender(tenantId, { phone: b.phone, ip: clientIp(req) }, "order_tracking", { order_number: orderNumber }))) return notFound;

  const admin = await createAdminClient();
  let q = admin.from("orders").select("id, order_number, status, payment_method, payment_status, shipping_address, created_at, fulfillment_type").eq("tenant_id", tenantId);
  q = id ? q.eq("id", id) : q.eq("order_number", orderNumber);
  const { data: order } = await q.maybeSingle();
  if (!order) return notFound;
  const addr = (order.shipping_address ?? {}) as Record<string, string | null>;
  if (!id && digits(addr.phone) !== phone) return notFound;

  const subFields = "id, sub_order_number, status, items, total, courier, tracking_number, consignment_id, courier_status, courier_tracking_url, courier_account_id, courier_synced_at, courier_booked_at, created_at, accepted_at, shipped_at, delivered_at, vendors(name)";
  const load = () => admin.from("sub_orders").select(subFields).eq("order_id", order.id).order("created_at");
  let { data: subs } = await load();

  // On-demand courier refresh, throttled per parcel.
  const stale = (subs ?? []).filter((s) => s.status === "shipped" && s.consignment_id && s.courier_account_id
    && (!s.courier_synced_at || Date.now() - new Date(s.courier_synced_at).getTime() > REFRESH_EVERY_MS));
  if (stale.length) {
    await Promise.all(stale.slice(0, 5).map((s) => refreshParcel(admin, s.id, requestOrigin(req)).catch(async () => {
      await admin.from("sub_orders").update({ courier_synced_at: new Date().toISOString() }).eq("id", s.id);
    })));
    ({ data: subs } = await load());
  }

  const ids = (subs ?? []).map((s) => s.id);
  const [{ data: events }, { data: tz }] = await Promise.all([
    ids.length
      ? admin.from("courier_events").select("sub_order_id, status, mapped_status, message, created_at").in("sub_order_id", ids).order("created_at")
      : Promise.resolve({ data: [] as { sub_order_id: string; status: string | null; mapped_status: string | null; message: string | null; created_at: string }[] }),
    admin.from("site_settings").select("timezone").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  return NextResponse.json({
    timezone: tz?.timezone || "Asia/Dhaka",
    order: {
      id: order.id, order_number: order.order_number, status: order.status, created_at: order.created_at,
      payment: order.payment_method === "cod" && order.payment_status !== "paid" ? "Cash on delivery" : order.payment_status === "paid" ? "Paid" : "Payment pending",
      // Only what the customer typed; no other customer's data is ever in here.
      ship_to: [addr.thana ?? addr.area, addr.district ?? addr.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", "),
    },
    parcels: (subs ?? []).map((s) => ({
      id: s.id, number: s.sub_order_number, status: s.status, seller: (s.vendors as unknown as { name: string } | null)?.name ?? "Seller",
      items: ((s.items ?? []) as { name?: string; quantity?: number }[]).map((i) => ({ name: i.name ?? "Item", quantity: i.quantity ?? 1 })),
      courier: s.courier, consignment_id: s.consignment_id ?? s.tracking_number, tracking_url: s.courier_tracking_url,
      times: { placed: s.created_at, accepted: s.accepted_at, shipped: s.shipped_at ?? s.courier_booked_at, delivered: s.delivered_at },
      events: (events ?? []).filter((e) => e.sub_order_id === s.id).map((e) => ({ status: e.status, message: buyerMessage(e.message), at: e.created_at })),
    })),
  });
}

/** Courier notes are written for the seller; the courier's fee to the seller
 *  is not the buyer's business, so it is dropped from the public timeline. */
function buyerMessage(m: string | null): string | null {
  return m ? m.replace(/\s*\(delivery fee [^)]*\)/i, "") : m;
}
