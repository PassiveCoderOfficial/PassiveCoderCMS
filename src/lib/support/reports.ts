import type { SupabaseClient } from "@supabase/supabase-js";
import { siteAccess } from "@/lib/mcp/auth";
import { deliverWebPush } from "@/lib/push/web-push";
import { notifyOwners } from "@/lib/push/notify-owners";
import { sendEmail } from "@/lib/email";

/**
 * Screenshot support reports (camera/? button). Server-side rules shared by
 * the report, inbox and capture routes.
 *
 * Who files: anyone who can edit the site (owner/admin/editor, the staff
 * member assigned to it, super admins). Who reads: super admins; staff for
 * the sites they are assigned to or tickets assigned to them; the site's
 * members for its "client" tickets (never "internal" ones).
 */

export const CAPTURE_BUCKET = "support-captures";
export const MAX_SHOTS = 10;

export type Shot = { path: string; caption?: string; w?: number; h?: number };

export interface SupportRole { superAdmin: boolean; staffId: string | null }

export async function supportRole(admin: SupabaseClient, userId: string): Promise<SupportRole> {
  const [{ data: sa }, { data: staff }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("pc_staff").select("id").eq("user_id", userId).eq("status", "active").maybeSingle(),
  ]);
  return { superAdmin: !!sa, staffId: (staff?.id as string | undefined) ?? null };
}

/** May this user file a report about this site? */
export async function canReport(admin: SupabaseClient, userId: string, tenantId: string): Promise<boolean> {
  return (await siteAccess(admin, userId, tenantId)) === "write";
}

/** Tenant ids a staff member looks after. */
export async function staffTenantIds(admin: SupabaseClient, staffId: string): Promise<string[]> {
  const { data } = await admin.from("tenants").select("id").or(`assigned_staff_id.eq.${staffId},referred_by_staff_id.eq.${staffId}`);
  return (data ?? []).map((t) => t.id as string);
}

type TicketRow = { id: string; tenant_id: string | null; user_id: string | null; assigned_to: string | null; visibility: string };

/** May this user see this ticket (and its captures)? `team` = as staff, internal tickets included. */
export async function ticketAccess(admin: SupabaseClient, userId: string, t: TicketRow): Promise<"team" | "client" | null> {
  const role = await supportRole(admin, userId);
  if (role.superAdmin) return "team";
  if (role.staffId && (t.assigned_to === userId || (t.tenant_id && (await staffTenantIds(admin, role.staffId)).includes(t.tenant_id)))) return "team";
  if (t.visibility !== "client") return null;
  if (t.user_id === userId) return "client";
  if (t.tenant_id) {
    const { data } = await admin.from("tenant_members").select("user_id").eq("tenant_id", t.tenant_id).eq("user_id", userId).maybeSingle();
    if (data) return "client";
  }
  return null;
}

/** Short-lived links to a ticket's screenshots (bucket is private). */
export async function signShots(admin: SupabaseClient, shots: Shot[] | null | undefined): Promise<(Shot & { url: string | null })[]> {
  const list = shots ?? [];
  if (!list.length) return [];
  const { data } = await admin.storage.from(CAPTURE_BUCKET).createSignedUrls(list.map((s) => s.path), 60 * 60);
  return list.map((s, i) => ({ ...s, url: data?.[i]?.signedUrl ?? null }));
}

/** Push to a user on every device they enabled, whatever site they enabled it on. */
async function pushUser(admin: SupabaseClient, userId: string, payload: { title: string; body: string; url: string; tag?: string }) {
  const { data } = await admin.from("web_push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
  if (data?.length) await deliverWebPush(data as never, { icon: "/favicon.ico", ...payload }).catch(() => null);
}

/**
 * Urgent reports also go to our WhatsApp. Uses CallMeBot when
 * WHATSAPP_ALERT_PHONE and CALLMEBOT_API_KEY are set; otherwise does nothing.
 */
async function whatsappAlert(text: string) {
  const phone = process.env.WHATSAPP_ALERT_PHONE, key = process.env.CALLMEBOT_API_KEY;
  if (!phone || !key) return;
  const u = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&apikey=${encodeURIComponent(key)}&text=${encodeURIComponent(text.slice(0, 900))}`;
  await fetch(u, { signal: AbortSignal.timeout(8000) }).catch(() => null);
}

const KIND_LABEL: Record<string, string> = { bug: "Bug", change: "Change request", question: "Question" };

/**
 * New report: assigned staff + super admins (push and email), WhatsApp for
 * urgent, and the client a confirmation (client-visible reports only).
 * Never throws.
 */
export async function notifyNewReport(admin: SupabaseClient, ticket: {
  id: string; number?: string; subject: string; kind: string | null; priority: string; visibility: string;
  tenant_id: string; user_id: string; context?: { url?: string } | null;
}) {
  try {
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0];
    const { data: t } = await admin.from("tenants").select("name, slug, assigned_staff_id").eq("id", ticket.tenant_id).maybeSingle();
    const site = (t?.name as string | undefined) ?? "a site";
    // Root dashboard Support inbox: works for staff and super admins alike.
    const inbox = `https://${root}/dashboard/support?ticket=${ticket.id}`;
    const title = `${ticket.priority === "urgent" ? "URGENT " : ""}${KIND_LABEL[ticket.kind ?? ""] ?? "Report"} on ${site}`;

    const [{ data: sas }, { data: staff }] = await Promise.all([
      admin.from("super_admins").select("user_id"),
      t?.assigned_staff_id ? admin.from("pc_staff").select("user_id, email").eq("id", t.assigned_staff_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const team = new Set<string>([...(sas ?? []).map((s) => s.user_id as string), ...(staff?.user_id ? [staff.user_id as string] : [])]);
    const { data: emails } = await admin.from("profiles").select("id, email").in("id", [...team]);
    await Promise.all([...team].map((u) => pushUser(admin, u, { title, body: ticket.subject, url: inbox, tag: `ticket-${ticket.id}` })));
    const to = (emails ?? []).map((e) => e.email as string).filter(Boolean);
    if (to.length) {
      await sendEmail({
        to, subject: `${title}: ${ticket.subject}`,
        html: `<p><strong>${title}</strong></p><p>${escapeHtml(ticket.subject)}</p>${ticket.context?.url ? `<p>Page: ${escapeHtml(ticket.context.url)}</p>` : ""}${ticket.visibility === "internal" ? "<p>Internal note (client does not see it).</p>" : ""}<p><a href="${inbox}">Open the ticket</a></p>`,
      }).catch(() => null);
    }
    if (ticket.priority === "urgent") await whatsappAlert(`${title}\n${ticket.subject}\n${inbox}`);

    if (ticket.visibility === "client") {
      await notifyOwners(ticket.tenant_id, "ticket", { title: "We got your report", body: `${ticket.subject}. We will reply here.`, url: "/dashboard/support", tag: `ticket-${ticket.id}` });
      const { data: me } = await admin.from("profiles").select("email").eq("id", ticket.user_id).maybeSingle();
      if (me?.email && !team.has(ticket.user_id)) {
        await sendEmail({
          to: me.email as string, subject: `We got your report: ${ticket.subject}`,
          html: `<p>Thanks, we received your report about ${escapeHtml(site)}:</p><p><strong>${escapeHtml(ticket.subject)}</strong></p><p>Our team will reply in your dashboard under Support. You will get an email when we do.</p>`,
        }).catch(() => null);
      }
    }
  } catch (e) {
    console.error("[support] notify failed", e);
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// ── Recordings and voice notes (phase 2) ────────────────────────────────────

export const MEDIA_BUCKET = "support-media";
export const MAX_MEDIA = 2; // one screen recording and one voice note per report or reply
export const MEDIA_SECONDS = 60;
export const MEDIA_DAYS = 7;

export type Media = { path: string; kind: "video" | "audio"; seconds: number; bytes?: number; created_at: string; deleted_at?: string | null };
export type MediaSlotRequest = { kind: "video" | "audio"; type: string };

const MEDIA_EXT: Record<string, string> = { "video/webm": "webm", "video/mp4": "mp4", "audio/webm": "webm", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/mpeg": "mp3" };

/** Signed upload slots for recordings, under `prefix/`. Unknown types are refused. */
export async function mediaSlots(admin: SupabaseClient, prefix: string, req: MediaSlotRequest[] | undefined) {
  const out: { path: string; token: string; type: string }[] = [];
  for (const m of (req ?? []).slice(0, MAX_MEDIA)) {
    const type = String(m.type ?? "").split(";")[0].trim();
    const ext = MEDIA_EXT[type];
    if (!ext || !type.startsWith(m.kind === "video" ? "video/" : "audio/")) throw new Error("This recording format is not supported");
    const path = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await admin.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message ?? "Upload not available");
    out.push({ path, token: data.token, type });
  }
  return out;
}

/** Shot upload slots in the capture bucket, under `prefix/`. */
export async function shotSlots(admin: SupabaseClient, prefix: string, count: number) {
  const n = Math.min(Math.max(Number(count) || 0, 0), MAX_SHOTS);
  const day = new Date().toISOString().slice(0, 10);
  const slots: { path: string; token: string }[] = [];
  for (let i = 0; i < n; i++) {
    const path = `${prefix}/${day}/${crypto.randomUUID()}.webp`;
    const { data, error } = await admin.storage.from(CAPTURE_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message ?? "Upload not available");
    slots.push({ path, token: data.token });
  }
  return slots;
}

/** Normalise media sent by a client: our prefix only, 60s max, stamped now. */
export function cleanMedia(list: unknown, prefix: string): Media[] {
  if (!Array.isArray(list)) return [];
  const now = new Date().toISOString();
  return list.slice(0, MAX_MEDIA).flatMap((m) => {
    const x = m as Partial<Media>;
    if (typeof x?.path !== "string" || !x.path.startsWith(`${prefix}/`) || x.path.includes("..") || (x.kind !== "video" && x.kind !== "audio")) return [];
    return [{ path: x.path.slice(0, 200), kind: x.kind, seconds: Math.min(Math.max(Math.round(Number(x.seconds) || 0), 0), MEDIA_SECONDS), bytes: Number(x.bytes) || undefined, created_at: now }];
  });
}

/** Short-lived links to recordings (null once deleted). */
export async function signMedia(admin: SupabaseClient, media: Media[] | null | undefined): Promise<(Media & { url: string | null; expires_at: string })[]> {
  const list = media ?? [];
  if (!list.length) return [];
  const live = list.filter((m) => !m.deleted_at);
  const { data } = live.length ? await admin.storage.from(MEDIA_BUCKET).createSignedUrls(live.map((m) => m.path), 60 * 60) : { data: [] };
  const urls = new Map(live.map((m, i) => [m.path, data?.[i]?.signedUrl ?? null]));
  return list.map((m) => ({ ...m, url: m.deleted_at ? null : urls.get(m.path) ?? null, expires_at: new Date(new Date(m.created_at).getTime() + MEDIA_DAYS * 864e5).toISOString() }));
}

/** Storage folder for a ticket's uploads (reports use the site id as before). */
export const ticketPrefix = (t: { tenant_id: string | null }) => t.tenant_id ?? "no-site";
