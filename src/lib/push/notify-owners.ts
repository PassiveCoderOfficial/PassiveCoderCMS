import { createAdminClient } from "@/lib/supabase/server";
import { pushToUser, type PushPayload } from "./web-push";

/**
 * Push to the people who run a site: the owner and its admins, on every device
 * they enabled notifications from (bell in the dashboard header). Each person
 * can switch an event type off (notification_prefs); missing = on. `allowed`
 * narrows it to who the app's notification settings let through.
 * Never throws: a failed push must not break the order/form/payment itself.
 */
export type OwnerEvent = "order" | "lead" | "booking" | "payment" | "ticket";

export const OWNER_EVENTS: { key: OwnerEvent; label: string; hint: string }[] = [
  { key: "order", label: "New orders", hint: "When a customer places an order" },
  { key: "lead", label: "New enquiries", hint: "Contact form messages" },
  { key: "booking", label: "New bookings", hint: "Appointment requests" },
  { key: "payment", label: "Payments and invoices", hint: "Payment received, invoice sent or due" },
  { key: "ticket", label: "Support replies", hint: "When Passive Coder answers your ticket" },
];

export async function notifyOwners(tenantId: string, event: OwnerEvent, payload: PushPayload, allowed?: ReadonlySet<string>): Promise<void> {
  try {
    const admin = await createAdminClient();
    const [{ data: members }, { data: prefs }] = await Promise.all([
      admin.from("tenant_members").select("user_id, role").eq("tenant_id", tenantId).in("role", ["owner", "admin"]),
      admin.from("notification_prefs").select("user_id, events").eq("tenant_id", tenantId),
    ]);
    const off = new Set((prefs ?? []).filter((p) => (p.events as Record<string, boolean>)?.[event] === false).map((p) => p.user_id as string));
    const targets = (members ?? []).map((m) => m.user_id as string).filter((u) => !off.has(u) && (!allowed || allowed.has(u)));
    await Promise.all(targets.map((u) => pushToUser(tenantId, u, { icon: "/favicon.ico", ...payload }).catch(() => null)));
  } catch (e) {
    console.error("[notifyOwners]", event, e instanceof Error ? e.message : e);
  }
}
