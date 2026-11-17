import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { computeSlots } from "@/lib/booking/slots";
import { createPublicBooking } from "@/lib/booking/public-booking";
import { upsertContact } from "@/lib/crm/upsertContact";
import { enrollInSequences } from "@/lib/crm/sequences";
import { notifyTenantEvent } from "@/lib/push/notify";
import { sendEmail } from "@/lib/email";
import { publicUrl } from "@/lib/tenant/site-urls";
import { isBlockedSender, recordSpam } from "@/lib/spam/guard";
import { isBotSubmission } from "@/lib/spam/rules";
import { localWord, type IntakeLang, type MessageMeta, type VisitCard } from "./intake-copy";
import {
  INTAKE_LEAD_TOOL, INTAKE_TOOLS, MAX_REQUESTS_PER_IP_DAY, addDays, cleanDate, cleanText, cleanTime, dialCodeFor, fmtWhen, forwardText,
  intakeContext, oneLiner, ownerLines, ownerReplyText, parseContact, parseJob, slotIsOpen, visitorWhatsappText, waLink, weekdayOf, withCountryCode, zonedNow,
  type Contact, type Job, type LeadFacts,
} from "./intake-rules";

/**
 * The chat's job intake for one AI turn. Built per turn with the tenant and
 * conversation fixed by the server: the model only supplies job text, a date
 * and a time, so nothing a visitor types can reach another site, change a
 * status or do anything except save this one visitor's own request.
 */
type Admin = Awaited<ReturnType<typeof createAdminClient>>;
type Args = Record<string, unknown>;

/** What the inbox shows for a conversation (site_chat_conversations.intake). Team-only. */
export type IntakeRecord = {
  kind: "visit" | "lead"; word: string; contact: Contact; job: Job; when: string | null; status: "pending" | "confirmed" | null;
  appointment_id: string | null; contact_id: string | null; owner_whatsapp: string | null; forward_whatsapp: string; card: VisitCard;
};

const LOOKAHEAD_DAYS = 10;

export type IntakeRun = {
  word: string;
  tools: unknown[];
  context: (left: number) => string;
  findTimes: (args: Args) => Promise<string>;
  requestVisit: (args: Args) => Promise<string>;
  saveLead: (args: Args) => Promise<string>;
  /** Set once saved; goes on the AI's message so the visitor keeps it across reloads. */
  card: () => VisitCard | null;
  leadId: () => string | null;
  /** If the model goes silent after a save, the visitor still gets a true answer. */
  fallback: () => string | null;
};

export async function createIntakeRun(o: {
  admin: Admin; tenantId: string; conversationId: string; sessionId: string; ip: string; siteName: string | null;
  word: string; lang: IntakeLang; businessWhatsapp: string | null; existing: unknown; transcript: () => string;
  /** Where the visitor is, from the request. Only used when the site has no country of its own yet. */
  visitorCountry?: string | null;
}): Promise<IntakeRun> {
  const { admin, tenantId, conversationId, sessionId, ip, word, lang } = o;
  const [{ data: site }, { data: profile }, { data: t }] = await Promise.all([
    admin.from("site_settings").select("timezone").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("tenant_business_profiles").select("country_code").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("tenants").select("name, slug, owner_id").eq("id", tenantId).maybeSingle(),
  ]);
  const tz = (site?.timezone as string | null) || "UTC";
  // A new trial has no country and a UTC clock, and wa.me needs a country code on a
  // local number, so until the owner sets one the visitor's own country decides.
  const dial = dialCodeFor(profile?.country_code as string | null, tz) ?? dialCodeFor(o.visitorCountry, null);
  // The visitor's WhatsApp button only exists when the business has a number.
  const buttonHint = o.businessWhatsapp ? " A button under your message lets them also send the details on WhatsApp." : "";
  const siteName = o.siteName || String(t?.name ?? "") || "the team";
  let saved = (o.existing && typeof o.existing === "object" ? o.existing : null) as IntakeRecord | null;

  const photoUrls = async (): Promise<string[]> => {
    const { data } = await admin.from("site_chat_messages").select("meta").eq("tenant_id", tenantId).eq("conversation_id", conversationId).eq("role", "visitor").limit(100);
    return (data ?? []).flatMap((m) => ((m.meta as MessageMeta | null)?.photos ?? []).map((p) => p.url));
  };

  /** Banned or bot: same answer as a real save, nothing stored, entry goes to the Spam folder. */
  const stopped = async (c: Contact, job: Job): Promise<boolean> => {
    if (await isBlockedSender(tenantId, { email: c.email, phone: c.phone, ip, session: sessionId }, "chat", { name: c.name, message: job.summary_en })) {
      await admin.from("site_chat_conversations").update({ blocked_at: new Date().toISOString() }).eq("id", conversationId).eq("tenant_id", tenantId);
      return true;
    }
    if (isBotSubmission({ name: c.name, email: c.email, work: job.work_type, location: job.location })) {
      await recordSpam(admin, { tenantId, source: "chat", reason: "bot", sender: { email: c.email, phone: c.phone, ip, session: sessionId }, data: { name: c.name, message: job.summary_en } }).catch(() => undefined);
      return true;
    }
    return false;
  };

  const overIpLimit = async (): Promise<boolean> => {
    if (!ip || ip === "unknown") return false;
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { data } = await admin.from("site_chat_conversations").select("id")
      .eq("tenant_id", tenantId).eq("ip", ip).gte("started_at", since).not("intake", "is", null).neq("id", conversationId).limit(MAX_REQUESTS_PER_IP_DAY);
    return (data ?? []).length >= MAX_REQUESTS_PER_IP_DAY;
  };

  const emailTarget = async (): Promise<string | null> => {
    const { data: s } = await admin.from("booking_settings").select("notify_email").eq("tenant_id", tenantId).maybeSingle();
    if (s?.notify_email) return s.notify_email as string;
    if (!t?.owner_id) return null;
    const { data: p } = await admin.from("profiles").select("email").eq("id", t.owner_id as string).maybeSingle();
    return (p?.email as string | null) ?? null;
  };

  /**
   * The owner hears through the systems every site already has. WhatsApp is
   * assisted-send: the alert carries a wa.me link the owner taps; nothing is
   * sent to WhatsApp automatically.
   */
  const alertOwner = async (f: LeadFacts, rec: IntakeRecord, entityId: string) => {
    const dashboard = (path: string) => publicUrl({ slug: String(t?.slug ?? ""), custom_domain: null }, path);
    const chatPath = `/dashboard/chat?c=${conversationId}`;
    const title = f.kind === "visit" ? `New ${f.word} request: ${f.contact.name}` : `New lead: ${f.contact.name}`;
    await notifyTenantEvent({
      tenantId, type: f.kind === "visit" ? "booking" : "lead", id: entityId, dedupeKey: `chat-intake:${conversationId}:${f.kind}`,
      title, body: `${oneLiner(f)}. ${f.contact.phone}`,
      // The phone app opens the chat; a browser push opens WhatsApp with the reply ready.
      path: `chat/${conversationId}`, webUrl: rec.owner_whatsapp ?? chatPath,
    }).catch(() => undefined);

    const to = await emailTarget().catch(() => null);
    if (!to) return;
    const lines = ownerLines(f);
    const links = [
      rec.owner_whatsapp ? ["Reply to them on WhatsApp", rec.owner_whatsapp, "#25D366"] : null,
      ["Forward this lead on WhatsApp", rec.forward_whatsapp, "#128C7E"],
      f.kind === "visit" ? [`Confirm or change the ${f.word}`, dashboard("/dashboard/bookings"), "#334155"] : null,
      ["Read the chat", dashboard(chatPath), "#334155"],
    ].filter((x): x is string[] => !!x);
    const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    await sendEmail({
      brandTenantId: tenantId, to,
      subject: f.kind === "visit" ? `${title}, ${f.when}` : title,
      text: [`${title}, from your website chat.`, "", ...lines, "", ...links.map(([label, url]) => `${label}:\n${url}`), "", "The WhatsApp links open a message for you to check and send."].join("\n"),
      html: `<p><b>${esc(title)}</b>, from your website chat.</p>${lines.map((l) => `<p style="margin:4px 0;white-space:pre-line">${esc(l)}</p>`).join("")}<p style="margin:16px 0">${links.map(([label, url, color]) => `<a href="${esc(url)}" style="display:inline-block;margin:0 6px 6px 0;padding:9px 14px;border-radius:8px;background:${color};color:#fff;text-decoration:none;font-weight:600">${esc(label)}</a>`).join("")}</p><p style="color:#666;font-size:13px">The WhatsApp links open a message for you to check and send.</p>`,
    }).catch(() => undefined);
  };

  const remember = async (rec: IntakeRecord) => {
    saved = rec;
    await admin.from("site_chat_conversations").update({
      intake: rec, visitor_name: rec.contact.name.slice(0, 120), ...(rec.contact_id ? { lead_contact_id: rec.contact_id } : {}),
    }).eq("id", conversationId).eq("tenant_id", tenantId);
  };

  const facts = (kind: "visit" | "lead", contact: Contact, job: Job, photos: string[], when: string | null, status: "pending" | "confirmed" | null, whenLocal?: string): LeadFacts =>
    ({ kind, word, siteName, contact, job, photos, when, whenLocal, status, lang });

  const record = (f: LeadFacts, appointmentId: string | null, contactId: string | null, manageUrl: string | null): IntakeRecord => ({
    kind: f.kind, word, contact: f.contact, job: f.job, when: f.when, status: f.status, appointment_id: appointmentId, contact_id: contactId,
    owner_whatsapp: f.contact.phone ? waLink(f.contact.phone, ownerReplyText(f)) : null,
    forward_whatsapp: waLink(null, forwardText(f)),
    card: {
      kind: f.kind, lang, word: localWord(word, lang), when: f.whenLocal ?? f.when, status: f.status,
      whatsapp: o.businessWhatsapp ? waLink(o.businessWhatsapp, visitorWhatsappText(f)) : null,
      manageUrl,
    },
  });

  const eventBody = (f: LeadFacts) => [...ownerLines(f), "", "--- Chat transcript ---", o.transcript()].join("\n").slice(0, 8000);

  return {
    word,
    tools: [INTAKE_LEAD_TOOL, ...INTAKE_TOOLS],
    context: (left) => intakeContext({ now: zonedNow(tz), left, word, saved: saved ? { kind: saved.kind, when: saved.when } : null }),
    card: () => saved?.card ?? null,
    leadId: () => saved?.contact_id ?? null,
    fallback: () => {
      if (!saved) return null;
      const w = localWord(word, lang);
      return lang === "ar"
        ? (saved.kind === "visit" ? `تم تسجيل طلب ${w}. سيتواصل معك الفريق.` : "وصلت تفاصيلك إلى الفريق وسيتواصل معك قريبًا.")
        : (saved.kind === "visit" ? `Your ${word} request is saved. The team will be in touch.` : "The team has your details and will contact you soon.");
    },

    async findTimes(args) {
      const { data: settings } = await admin.from("booking_settings").select("enabled, min_notice_hours").eq("tenant_id", tenantId).maybeSingle();
      if (!settings?.enabled) return "unavailable: this business does not take visit times online. Ask when suits them and use create_lead.";
      const minNotice = Number(settings.min_notice_hours ?? 0);
      const today = zonedNow(tz).date;
      const asked = cleanDate(args.date);
      const from = asked && asked >= today ? asked : today;
      const days: { date: string; weekday: string; times: string[] }[] = [];
      for (let i = 0; i < LOOKAHEAD_DAYS && days.length < 3; i++) {
        const date = addDays(from, i);
        const { slots } = await computeSlots(tenantId, date);
        const open = slots.filter((s) => slotIsOpen(date, s.start, tz, minNotice)).slice(0, 6).map((s) => s.start);
        if (open.length) days.push({ date, weekday: weekdayOf(date), times: open });
        if (asked && i === 0 && open.length) break;
      }
      if (!days.length) return "unavailable: no open times in the next days. Ask when suits them and use create_lead.";
      return JSON.stringify({ timezone: tz, days });
    },

    async requestVisit(args) {
      if (saved?.kind === "visit") return `ok: the ${word} request is already saved for ${saved.when}. Do not save another.`;
      const c = parseContact(args);
      if (!c.ok) return c.error;
      const date = cleanDate(args.date);
      const time = cleanTime(args.time);
      if (!date || !time) return "error: choose a date and time returned by find_visit_times";
      const job = parseJob(args);
      const contact: Contact = { ...c.value, phone: withCountryCode(c.value.phone, dial) };
      const when = fmtWhen(date, time);
      const said = `ok: the ${word} request for ${when} is saved and waiting for the team to confirm. Say it is requested, not confirmed.`;
      if (await stopped(contact, job)) return said;
      if (await overIpLimit()) return "error: too many requests from this visitor today. Ask them to contact the team on WhatsApp or by phone.";

      const { data: settings } = await admin.from("booking_settings").select("min_notice_hours").eq("tenant_id", tenantId).maybeSingle();
      if (!slotIsOpen(date, time, tz, Number(settings?.min_notice_hours ?? 0))) return "error: that time is no longer open. Call find_visit_times again and offer other times.";

      const photos = await photoUrls();
      const draft = facts("visit", contact, job, photos, when, "pending");
      const r = await createPublicBooking(tenantId, { date, start: time, name: contact.name, email: contact.email, phone: contact.phone, message: ownerLines(draft).join("\n") }, "site-chat", ip, {
        visitLabel: word, lang, whenLabel: fmtWhen(date, time, lang), conversationId, session: sessionId, quietOwner: true, inStream: true,
        contact: {
          source: "ai_chat", tags: ["ai-chat", "site-visit"], custom: { job }, quiet: true,
          title: `${word.charAt(0).toUpperCase()}${word.slice(1)} request: ${when}`, body: eventBody(draft),
          meta: { source: "ai_chat", session_id: sessionId, conversation_id: conversationId },
        },
      });
      if (r.status === 409) return "error: that time was just taken. Call find_visit_times again and offer other times.";
      if (r.status >= 400) {
        const msg = typeof r.body.error === "string" ? r.body.error : "could not save";
        return /not enabled/i.test(msg) ? "unavailable: use create_lead instead." : `error: ${msg}`;
      }
      const status = r.body.status === "confirmed" ? "confirmed" : "pending";
      const f = facts("visit", contact, job, photos, when, status, fmtWhen(date, time, lang));
      const rec = record(f, r.appointmentId ?? null, r.contactId ?? null, typeof r.body.manageUrl === "string" ? r.body.manageUrl : null);
      await remember(rec);
      await alertOwner(f, rec, r.appointmentId ?? conversationId);
      return status === "confirmed"
        ? `ok: the ${word} is confirmed for ${when}. Tell them.${buttonHint}`
        : `ok: the ${word} request for ${when} is saved and waiting for the team to confirm. Say it is requested, not confirmed.${buttonHint}`;
    },

    async saveLead(args) {
      if (saved) return "ok: the visitor's details are already saved for the team. Do not save again.";
      const c = parseContact(args);
      if (!c.ok) return c.error;
      const job = parseJob(args);
      const contact: Contact = { ...c.value, phone: withCountryCode(c.value.phone, dial) };
      const said = "ok: the team has their details and will contact them.";
      if (await stopped(contact, job)) return said;
      if (await overIpLimit()) return "error: too many requests from this visitor today. Ask them to contact the team on WhatsApp or by phone.";
      const photos = await photoUrls();
      const f = facts("lead", contact, job, photos, cleanText(args.preferred_time, 80) || null, null);
      const id = await upsertContact({
        tenantId, name: contact.name, phone: contact.phone, email: contact.email || null, source: "ai_chat",
        consentEmail: !!contact.email, tags: ["ai-chat"], custom: { job }, quiet: true,
        event: { type: "note", title: `AI chat lead${job.work_type ? `: ${job.work_type}` : ""}`, body: eventBody(f), meta: { source: "ai_chat", session_id: sessionId, conversation_id: conversationId } },
      }).catch(() => null);
      if (!id) return "error: could not save, ask the visitor to use WhatsApp";
      await enrollInSequences(tenantId, id, "enquiry", { name: contact.name, phone: contact.phone, site_name: siteName, service: job.work_type || "enquiry" }).catch(() => undefined);
      const rec = record(f, null, id, null);
      await remember(rec);
      await alertOwner(f, rec, id);
      return `${said}${buttonHint}`;
    },
  };
}
