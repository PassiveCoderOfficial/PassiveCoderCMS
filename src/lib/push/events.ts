// Pure rules for admin notifications (no DB, no network) so they can be unit
// tested: event types, Android channels, deep links, preference filtering
// and quiet hours. The app mirrors the types in
// apps/mobile-admin/features/notifications/payload.ts.

import { SA_EVENTS, TENANT_EVENTS } from "@/types/api/push";
import type { AdminEventType, AttendanceEventType, ProjectEventType, SaEventType, TenantEventType } from "@/types/api/push";

export { SA_EVENTS, TENANT_EVENTS };
export type { AdminEventType, AttendanceEventType, ProjectEventType, SaEventType, TenantEventType };

/** Android channel ids the app creates (features/notifications/channels.ts). */
export function channelFor(type: AdminEventType): string {
  switch (type) {
    case "chat": case "lead": return "leads";
    case "chat_human": return "urgent";
    case "order": case "order_action": return "orders";
    case "booking": case "booking_cancelled": return "bookings";
    case "support_reply": case "support_approval": return "support";
    case "payment": case "low_credits": return "billing";
    case "support_escalation": case "platform_error": return "urgent";
    default: return "default";
  }
}

/** Events only owners/admins get (money); the rest go to every non-viewer member. */
export const OWNER_ONLY: ReadonlySet<AdminEventType> = new Set(["payment", "low_credits"]);

export function tenantDeeplink(tenantId: string, path: string): string {
  return `pcadmin://sites/${tenantId}/${path.replace(/^\/+/, "")}`;
}

/** Default app path for an event when the caller gives none. */
export function defaultPath(type: AdminEventType, id?: string | null): string {
  switch (type) {
    case "chat": case "chat_human": return id ? `chat/${id}` : "chat";
    case "lead": return id ? `leads/${id}` : "leads";
    case "order": case "order_action": return id ? `orders/${id}` : "orders";
    case "booking": case "booking_cancelled": return id ? `bookings/${id}` : "bookings";
    case "support_reply": case "support_approval": return id ? `support/${id}` : "support";
    case "payment": return "billing";
    case "low_credits": return "subscription";
    case "low_stock": return "inventory";
    case "review": return "reviews";
    case "price_request": return "price-requests";
    default: return "dashboard";
  }
}

export interface QuietHours { start: string; end: string; tz?: string }
export type SiteMode = "all" | "selected";
export type RecipientRole = "super_admin" | "staff" | "client";
export interface NotificationPrefs {
  disabled?: Record<string, string[]> | null;
  quiet_hours?: QuietHours | null;
  /** Master switch: no pushes at all, alerts still reach the inbox. */
  paused?: boolean | null;
  /** null = the role's default (defaultSiteMode). */
  site_mode?: SiteMode | null;
  selected_sites?: string[] | null;
  /** Owned sites always push when a visitor asks for a person. null = the role's default. */
  human_chat_owned?: boolean | null;
}

/** Super admins and staff follow chosen sites; a client hears all of theirs. */
export function defaultSiteMode(role: RecipientRole): SiteMode {
  return role === "client" ? "all" : "selected";
}

/** Clients who switch off their own site mean it; our team must not miss a waiting visitor. */
export function defaultHumanChatOwned(role: RecipientRole): boolean {
  return role !== "client";
}

function minutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm?.trim() ?? "");
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : null;
}

/** Is `now` inside the quiet window (in the user's time zone)? Handles windows over midnight. */
export function inQuietHours(q: QuietHours | null | undefined, now: Date = new Date()): boolean {
  if (!q) return false;
  const s = minutes(q.start), e = minutes(q.end);
  if (s === null || e === null || s === e) return false;
  let cur: number;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: q.tz || "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    cur = Number(parts.find((p) => p.type === "hour")?.value) * 60 + Number(parts.find((p) => p.type === "minute")?.value);
  } catch {
    cur = now.getUTCHours() * 60 + now.getUTCMinutes();
  }
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

/** Sanitise a prefs body from the client. Returns null when it is not valid. */
export function parsePrefs(raw: unknown, allowed: readonly string[]): NotificationPrefs | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: NotificationPrefs = {};
  if ("paused" in r) {
    if (typeof r.paused !== "boolean") return null;
    out.paused = r.paused;
  }
  if ("site_mode" in r) {
    if (r.site_mode !== "all" && r.site_mode !== "selected") return null;
    out.site_mode = r.site_mode;
  }
  if ("human_chat_owned" in r) {
    if (typeof r.human_chat_owned !== "boolean") return null;
    out.human_chat_owned = r.human_chat_owned;
  }
  if ("selected_sites" in r) {
    if (!Array.isArray(r.selected_sites)) return null;
    if (!r.selected_sites.every((x) => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x))) return null;
    out.selected_sites = Array.from(new Set(r.selected_sites as string[]));
  }
  if ("disabled" in r) {
    if (!r.disabled || typeof r.disabled !== "object" || Array.isArray(r.disabled)) return null;
    const d: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(r.disabled as Record<string, unknown>)) {
      if (!Array.isArray(v)) return null;
      if (k !== "*" && !/^[0-9a-f-]{36}$/i.test(k)) return null;
      const list = Array.from(new Set(v.filter((x): x is string => typeof x === "string" && (x === "*" || allowed.includes(x)))));
      if (list.length) d[k] = list;
    }
    out.disabled = d;
  }
  if ("quiet_hours" in r) {
    const q = r.quiet_hours as Record<string, unknown> | null;
    if (q === null) out.quiet_hours = null;
    else if (q && typeof q.start === "string" && typeof q.end === "string" && minutes(q.start) !== null && minutes(q.end) !== null) {
      out.quiet_hours = { start: q.start, end: q.end, tz: typeof q.tz === "string" && q.tz.length < 64 ? q.tz : "Asia/Dhaka" };
    } else return null;
  }
  return out;
}

/** Facts about a site and its recipients the push rules need. Missing = a client with no special link. */
export interface DeliveryContext {
  roles?: ReadonlyMap<string, RecipientRole>;
  ownerId?: string | null;
  /** Staff assigned to this site, or called on for it (root site chat). */
  assigned?: ReadonlySet<string>;
}

/** Should this event buzz this user's phone? Everything still reaches their inbox. Pure. */
export function wantsPush(
  prefs: NotificationPrefs | null | undefined,
  userId: string,
  tenantId: string | null,
  type: AdminEventType,
  ctx: DeliveryContext = {},
  now: Date = new Date(),
): boolean {
  if (type === "test") return true;
  if (prefs?.paused) return false;
  if (inQuietHours(prefs?.quiet_hours, now)) return false;
  const d = prefs?.disabled ?? {};
  const all = d["*"] ?? [];
  if (all.includes("*") || all.includes(type)) return false;
  // Platform events are about us, not one client's site, and a project alert is
  // addressed to this person (assigned, @mentioned), and so is attendance: no site rules.
  if (!tenantId || type === "project" || type === "attendance" || (SA_EVENTS as readonly string[]).includes(type)) return true;
  const site = d[tenantId] ?? [];
  if (site.includes(type)) return false;

  const role = ctx.roles?.get(userId) ?? "client";
  const owner = ctx.ownerId === userId;
  const muted = site.includes("*");
  const mode = prefs?.site_mode ?? defaultSiteMode(role);
  const chosen = mode === "all"
    || (prefs?.selected_sites ?? []).includes(tenantId)
    || (role === "staff" && (owner || !!ctx.assigned?.has(userId)));
  if (chosen && !muted) return true;
  return type === "chat_human" && owner && (prefs?.human_chat_owned ?? defaultHumanChatOwned(role));
}

/** Who receives what, given each user's prefs. Every recipient gets the inbox row; only `push` buzzes. Pure; exported for tests. */
export function planDelivery(
  recipients: string[],
  prefsByUser: Map<string, NotificationPrefs>,
  tenantId: string | null,
  type: AdminEventType,
  now: Date = new Date(),
  ctx: DeliveryContext = {},
): { inbox: string[]; push: Set<string> } {
  const inbox = Array.from(new Set(recipients));
  const push = new Set(inbox.filter((u) => wantsPush(prefsByUser.get(u), u, tenantId, type, ctx, now)));
  return { inbox, push };
}
