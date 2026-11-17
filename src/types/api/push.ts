/**
 * Push notifications to the mobile admin app. The rules (event types,
 * Android channel per event, deep links) live in src/lib/push/events.ts and
 * are sent by src/lib/push/notify.ts; the app mirrors them in
 * apps/mobile-admin/features/notifications/{channels,payload}.ts.
 */
export const ADMIN_PUSH_CHANNEL = "default";

// Self-contained (src/types/api must not import app-only paths): the event
// lists live here and src/lib/push/events.ts re-exports them.
export const TENANT_EVENTS = [
  "chat", "chat_human", "lead", "order", "order_action", "booking", "booking_cancelled",
  "support_reply", "support_approval", "payment", "low_credits",
  "low_stock", "review", "price_request",
] as const;
export const SA_EVENTS = ["support_escalation", "platform_error"] as const;

export type TenantEventType = (typeof TENANT_EVENTS)[number];
export type SaEventType = (typeof SA_EVENTS)[number];
/** Task assigned or @mentioned in Projects. Kept out of TENANT_EVENTS (the prefs list) until the module is released. */
export type ProjectEventType = "project";
/** Staff attendance (reminders, late starts, requests and decisions): addressed to the person, no site rules. */
export type AttendanceEventType = "attendance";
export type AdminEventType = TenantEventType | SaEventType | ProjectEventType | AttendanceEventType | "test";
export type AdminPushType = AdminEventType;

/** `data` payload on every admin push. */
export interface AdminPushData {
  type: string;
  tenantId?: string;
  id?: string;
  /** e.g. pcadmin://sites/<tenantId>/leads/<contactId> */
  deeplink?: string;
  /** admin_notifications row, so a tap can mark it read. */
  notificationId?: string;
}
