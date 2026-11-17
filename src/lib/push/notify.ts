// One helper for every admin notification: writes the in-app inbox
// (admin_notifications), pushes to the mobile admin app (Expo) and, for the
// event kinds the web dashboard bell knows, to browsers (notifyOwners).
// Never throws: a failed notification must not break the order/booking/etc.
//
//   notifyTenantEvent({ tenantId, type: "order", id: order.id, title, body })
//   notifySuperAdmins({ type: "support_escalation", id: ticketId, title, body })

import { createAdminClient } from "@/lib/supabase/server";
import { notifyOwners, type OwnerEvent } from "./notify-owners";
import { sendAdminExpo, type ExpoMessage } from "./expo";
import { pushToUser } from "./web-push";
import {
  OWNER_ONLY, channelFor, defaultPath, planDelivery, tenantDeeplink,
  type AdminEventType, type AttendanceEventType, type DeliveryContext, type NotificationPrefs, type ProjectEventType, type RecipientRole, type SaEventType, type TenantEventType,
} from "./events";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

export interface EventInput {
  title: string;
  body?: string;
  /** Entity id (order, booking, contact, ticket...). */
  id?: string | null;
  /** App path under sites/<tenantId>/ when the default for the type is wrong. */
  path?: string;
  /** Same key = same event; a repeat is dropped per recipient. */
  dedupeKey?: string;
}

export { planDelivery };

const WEB_EVENT: Partial<Record<AdminEventType, OwnerEvent>> = {
  chat: "lead", chat_human: "lead", lead: "lead", order: "order", order_action: "order", booking: "booking", booking_cancelled: "booking",
  payment: "payment", support_reply: "ticket", support_approval: "ticket",
};

/** Prefs and site facts for the push rules. `onDuty` users count as assigned to this site. */
async function loadPlan(admin: Admin, recipients: string[], tenantId: string | null, type: AdminEventType, onDuty?: string[]) {
  const [{ data: prefRows }, { data: sas }, { data: staff }, { data: tenant }] = await Promise.all([
    admin.from("admin_notification_prefs").select("user_id, disabled, quiet_hours, paused, site_mode, selected_sites, human_chat_owned").in("user_id", recipients),
    admin.from("super_admins").select("user_id").in("user_id", recipients),
    admin.from("pc_staff").select("id, user_id").eq("status", "active").in("user_id", recipients),
    tenantId ? admin.from("tenants").select("owner_id, assigned_staff_id").eq("id", tenantId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const prefs = new Map<string, NotificationPrefs>((prefRows ?? []).map((p) => [p.user_id as string, p as NotificationPrefs]));
  const roles = new Map<string, RecipientRole>();
  for (const s of staff ?? []) roles.set(s.user_id as string, "staff");
  for (const s of sas ?? []) roles.set(s.user_id as string, "super_admin");
  const assigned = new Set<string>(onDuty ?? []);
  for (const s of staff ?? []) if (s.id === tenant?.assigned_staff_id) assigned.add(s.user_id as string);
  const ctx: DeliveryContext = { roles, assigned, ownerId: (tenant?.owner_id as string | null) ?? null };
  return planDelivery(recipients, prefs, tenantId, type, new Date(), ctx);
}

type Plan = Awaited<ReturnType<typeof loadPlan>>;

async function deliver(admin: Admin, plan: Plan, tenantId: string | null, type: AdminEventType, ev: EventInput, deeplink: string) {
  if (!plan.inbox.length) return { inbox: 0, sent: 0, devices: 0 };

  const dedupe = ev.dedupeKey ?? `${type}:${crypto.randomUUID()}`;
  const data = { type, tenantId: tenantId ?? undefined, id: ev.id ?? undefined, deeplink };
  const { data: rows } = await admin.from("admin_notifications").upsert(
    plan.inbox.map((user_id) => ({ user_id, tenant_id: tenantId, type, title: ev.title.slice(0, 200), body: (ev.body ?? "").slice(0, 500), data, dedupe_key: dedupe })),
    { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
  ).select("id, user_id");
  const fresh = (rows ?? []).filter((r) => plan.push.has(r.user_id as string));
  if (!fresh.length) return { inbox: rows?.length ?? 0, sent: 0, devices: 0 };

  const { data: devices } = await admin.from("admin_app_devices").select("user_id, expo_token").in("user_id", fresh.map((r) => r.user_id as string));
  const idByUser = new Map(fresh.map((r) => [r.user_id as string, r.id as string]));
  const messages: ExpoMessage[] = (devices ?? []).map((d) => ({
    to: d.expo_token as string,
    title: ev.title,
    body: ev.body ?? "",
    channelId: channelFor(type),
    data: { ...data, notificationId: idByUser.get(d.user_id as string) },
  }));
  const { sent } = messages.length ? await sendAdminExpo(admin, messages) : { sent: 0 };
  return { inbox: rows?.length ?? 0, sent, devices: messages.length };
}

/** People on a site who should hear about `type` (owner, non-viewer members, assigned staff; money events owner/admin only). */
async function tenantRecipients(admin: Admin, tenantId: string, type: AdminEventType): Promise<{ users: string[]; demo: boolean }> {
  const [{ data: tenant }, { data: members }] = await Promise.all([
    admin.from("tenants").select("owner_id, demo_expires_at, pc_staff!tenants_assigned_agent_id_fkey(user_id, status)").eq("id", tenantId).maybeSingle(),
    admin.from("tenant_members").select("user_id, role").eq("tenant_id", tenantId),
  ]);
  const users = new Set<string>();
  if (tenant?.owner_id) users.add(tenant.owner_id as string);
  for (const m of members ?? []) {
    const role = m.role as string;
    if (role === "viewer") continue;
    if (OWNER_ONLY.has(type) && role !== "owner" && role !== "admin") continue;
    users.add(m.user_id as string);
  }
  const assigned = (Array.isArray(tenant?.pc_staff) ? tenant.pc_staff[0] : tenant?.pc_staff) as { user_id?: string | null; status?: string } | null | undefined;
  if (assigned?.user_id && assigned.status === "active" && !OWNER_ONLY.has(type)) users.add(assigned.user_id);
  return { users: Array.from(users), demo: !!tenant?.demo_expires_at };
}

export async function notifyTenantEvent(input: EventInput & { tenantId: string; type: TenantEventType; webUrl?: string }): Promise<void> {
  const { tenantId, type } = input;
  try {
    const web = WEB_EVENT[type];
    const admin = await createAdminClient();
    const { users, demo } = await tenantRecipients(admin, tenantId, type);
    // Demo sites belong to the staff member who built them: never ping staff phones for prospect activity.
    if (demo) return;
    if (!users.length) return;
    const plan = await loadPlan(admin, users, tenantId, type);
    await Promise.all([
      deliver(admin, plan, tenantId, type, input, tenantDeeplink(tenantId, input.path ?? defaultPath(type, input.id))),
      web ? notifyOwners(tenantId, web, { title: input.title, body: input.body ?? "", url: input.webUrl ?? "/dashboard", tag: input.dedupeKey ?? type }, plan.push) : null,
    ]);
  } catch (e) {
    console.error("[notifyTenantEvent]", type, e instanceof Error ? e.message : e);
  }
}

export async function notifySuperAdmins(input: EventInput & { type: SaEventType; tenantId?: string | null }): Promise<void> {
  try {
    const admin = await createAdminClient();
    const { data } = await admin.from("super_admins").select("user_id");
    const users = (data ?? []).map((r) => r.user_id as string);
    const link = input.type === "support_escalation" && input.id ? `pcadmin://admin/tickets/${input.id}` : input.type === "platform_error" ? "pcadmin://admin/errors" : "pcadmin://admin";
    if (!users.length) return;
    const plan = await loadPlan(admin, users, input.tenantId ?? null, input.type);
    await deliver(admin, plan, input.tenantId ?? null, input.type, input, link);
  } catch (e) {
    console.error("[notifySuperAdmins]", input.type, e instanceof Error ? e.message : e);
  }
}

/** Event for a given list of users (inbox + app push), e.g. staff on the root site's chat. `onDuty` users count as assigned to the site. Never throws. */
export async function notifyUsers(userIds: string[], input: EventInput & { tenantId: string; type: TenantEventType | ProjectEventType | AttendanceEventType; onDuty?: string[]; webUrl?: string; deeplink?: string }): Promise<void> {
  try {
    const users = Array.from(new Set(userIds));
    if (!users.length) return;
    const admin = await createAdminClient();
    const plan = await loadPlan(admin, users, input.tenantId, input.type, input.onDuty);
    const done = await deliver(admin, plan, input.tenantId, input.type, input, input.deeplink ?? tenantDeeplink(input.tenantId, input.path ?? defaultPath(input.type, input.id)));
    // Project and attendance alerts also reach browsers with the bell on; a repeat (same dedupeKey) writes no row, so it doesn't buzz twice.
    if ((input.type === "project" || input.type === "attendance") && done.inbox) {
      await Promise.all([...plan.push].map((u) => pushToUser(input.tenantId, u, {
        icon: "/favicon.ico", title: input.title, body: input.body ?? "", url: input.webUrl ?? "/dashboard", tag: input.dedupeKey ?? input.type,
      }).catch(() => null)));
    }
  } catch (e) {
    console.error("[notifyUsers]", input.type, e instanceof Error ? e.message : e);
  }
}

/** Test push to one user's own devices (Settings > Notifications, scripts/send-test-push). */
export async function sendTestPush(userId: string): Promise<{ inbox: number; sent: number; devices: number }> {
  const admin = await createAdminClient();
  return deliver(admin, { inbox: [userId], push: new Set([userId]) }, null, "test", {
    title: "Test notification",
    body: "Push notifications are working on this phone.",
  }, "pcadmin://alerts");
}
