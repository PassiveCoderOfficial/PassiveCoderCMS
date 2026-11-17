/**
 * Courier status -> our parcel flow. Pure, so tests can import it.
 *
 * Our flow: pending -> accepted -> packed -> shipped -> delivered | returned
 * (cancelled only before shipping). A courier status only ever moves a parcel
 * forward; delivered, cancelled and returned are final.
 */
export type CourierProvider = "steadfast" | "pathao";
export type FlowStatus = "pending" | "accepted" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";
export type MappedStatus = "shipped" | "delivered" | "returned" | null;

export const PROVIDER_LABEL: Record<CourierProvider, string> = { steadfast: "Steadfast", pathao: "Pathao" };

const slug = (s: string | null | undefined) =>
  String(s ?? "").trim().toLowerCase().replace(/^order\./, "").replace(/[\s.-]+/g, "_");

/** Steadfast delivery_status values (status_by_* and webhooks). */
export function mapSteadfast(status: string | null | undefined): MappedStatus {
  const s = slug(status);
  if (s === "delivered" || s === "partial_delivered") return "delivered";
  if (s === "cancelled") return "returned";
  // pending, in_review, hold, unknown and every *_approval_pending: the
  // parcel is with the courier (it was booked), nothing final yet.
  return null;
}

/** Pathao order_status_slug values and webhook event names (order.picked ...). */
export function mapPathao(status: string | null | undefined): MappedStatus {
  const s = slug(status);
  if (["delivered", "partial_delivery", "partial_delivered"].includes(s)) return "delivered";
  if (["return", "returned", "paid_return", "pickup_cancelled", "cancelled"].includes(s)) return "returned";
  if (["picked", "in_transit", "at_the_sorting_hub", "received_at_last_mile_hub", "assigned_for_delivery", "on_hold", "delivery_failed"].includes(s)) return "shipped";
  return null;
}

export function mapCourierStatus(provider: CourierProvider, status: string | null | undefined): MappedStatus {
  return provider === "steadfast" ? mapSteadfast(status) : mapPathao(status);
}

const FINAL: FlowStatus[] = ["delivered", "cancelled", "returned"];
const ORDER: FlowStatus[] = ["pending", "accepted", "packed", "shipped"];

/** The status a parcel should move to, or null to leave it. Never backwards. */
export function nextStatus(current: string, mapped: MappedStatus): FlowStatus | null {
  if (!mapped || FINAL.includes(current as FlowStatus)) return null;
  if (!ORDER.includes(current as FlowStatus)) return null;
  if (mapped === "shipped") return current === "shipped" ? null : "shipped";
  return mapped;
}

/** Plain words for a courier status, for the tracking timeline. */
export function courierStatusLabel(status: string | null | undefined): string {
  const s = slug(status);
  if (!s) return "Update";
  const words: Record<string, string> = {
    in_review: "Booked, in review", pending: "Booked with courier", hold: "On hold", picked: "Picked up by courier",
    pickup_requested: "Pickup requested", assigned_for_pickup: "Rider assigned for pickup", at_the_sorting_hub: "At the sorting hub",
    in_transit: "In transit", received_at_last_mile_hub: "At the delivery hub", assigned_for_delivery: "Out for delivery",
    delivered: "Delivered", partial_delivered: "Partly delivered", partial_delivery: "Partly delivered",
    delivery_failed: "Delivery attempt failed", on_hold: "On hold", return: "Returned to seller", returned: "Returned to seller",
    paid_return: "Returned to seller", cancelled: "Cancelled", pickup_cancelled: "Pickup cancelled", pickup_failed: "Pickup failed",
    created: "Booked with courier", updated: "Details updated", delivered_approval_pending: "Delivered, confirming",
    partial_delivered_approval_pending: "Partly delivered, confirming", cancelled_approval_pending: "Cancelling",
    unknown_approval_pending: "Checking status", unknown: "Checking status",
  };
  return words[s] ?? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Who holds the customer's money for a parcel (sub_orders.money_holder). */
export function moneyHolder(p: { prepaid: boolean; viaPlatformAccount: boolean }): "platform" | "vendor" {
  if (p.prepaid) return "platform";
  return p.viaPlatformAccount ? "platform" : "vendor";
}

/** Public tracking link on the courier's site. */
export function publicTrackingUrl(provider: CourierProvider, p: { trackingCode?: string | null; consignmentId?: string | null; phone?: string | null }): string | null {
  if (provider === "steadfast") return p.trackingCode ? `https://steadfast.com.bd/t/${encodeURIComponent(p.trackingCode)}` : null;
  if (!p.consignmentId) return null;
  const phone = p.phone ? `&phone=${encodeURIComponent(p.phone)}` : "";
  return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(p.consignmentId)}${phone}`;
}

/** BD mobile in the 01XXXXXXXXX shape couriers want. */
export function courierPhone(phone: string | null | undefined): string {
  const d = String(phone ?? "").replace(/\D/g, "");
  if (d.startsWith("880")) return `0${d.slice(3)}`.slice(0, 11);
  if (d.startsWith("88")) return d.slice(2, 13);
  return d.slice(0, 11);
}
