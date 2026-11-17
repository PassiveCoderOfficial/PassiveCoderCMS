import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { extractIdentity, normalizePhone, upsertContact } from "@/lib/crm/upsertContact";
import { formRow } from "@/lib/contact/form-row";
import { recordSpam } from "./guard";
import { DEFAULT_IP_BAN_DAYS, emailKey, phoneKey, senderKeys, type BlockKind, type Sender } from "./rules";

/**
 * Banning and undoing a ban. A ban starts from something the sender actually
 * sent to this site (a chat, form submission, CRM contact or spam entry), so
 * nobody can type in someone else's customer and silence them everywhere.
 */
type Admin = Awaited<ReturnType<typeof createAdminClient>>;

export type BanSourceType = "chat" | "submission" | "contact" | "spam";
export interface BanInput {
  tenantId: string;
  userId: string;
  /** Super admin or active staff. */
  platform: boolean;
  from: { type: BanSourceType; id: string };
  banIp?: boolean;
  /** 0 = no expiry. Defaults to DEFAULT_IP_BAN_DAYS. */
  ipDays?: number;
  scope?: "site" | "all";
  reason?: string | null;
}

interface Resolved { sender: Sender; contactId?: string | null; conversationId?: string | null }

async function resolveSender(admin: Admin, tenantId: string, from: BanInput["from"]): Promise<Resolved | null> {
  switch (from.type) {
    case "chat": {
      const { data: c } = await admin.from("site_chat_conversations").select("id, session_id, ip, lead_contact_id").eq("tenant_id", tenantId).eq("id", from.id).maybeSingle();
      if (!c) return null;
      let email: string | null = null, phone: string | null = null;
      if (c.lead_contact_id) {
        const { data: lead } = await admin.from("contacts").select("email, phone").eq("tenant_id", tenantId).eq("id", c.lead_contact_id).maybeSingle();
        email = (lead?.email as string | null) ?? null;
        phone = (lead?.phone as string | null) ?? null;
      }
      return { sender: { email, phone, ip: c.ip as string | null, session: c.session_id as string | null }, contactId: c.lead_contact_id as string | null, conversationId: c.id as string };
    }
    case "submission": {
      const { data: s } = await admin.from("contact_form_submissions").select("data, ip").eq("tenant_id", tenantId).eq("id", from.id).maybeSingle();
      if (!s) return null;
      const { email, phone } = extractIdentity((s.data ?? {}) as Record<string, string>);
      return { sender: { email, phone, ip: s.ip as string | null } };
    }
    case "contact": {
      const { data: c } = await admin.from("contacts").select("id, email, phone, whatsapp").eq("tenant_id", tenantId).eq("id", from.id).maybeSingle();
      if (!c) return null;
      const { data: chat } = await admin.from("site_chat_conversations").select("id, session_id, ip").eq("tenant_id", tenantId).eq("lead_contact_id", c.id).order("last_at", { ascending: false }).limit(1).maybeSingle();
      return { sender: { email: c.email as string | null, phone: (c.phone ?? c.whatsapp) as string | null, ip: (chat?.ip as string | null) ?? null, session: (chat?.session_id as string | null) ?? null }, contactId: c.id as string, conversationId: (chat?.id as string | null) ?? null };
    }
    case "spam": {
      const { data: e } = await admin.from("spam_entries").select("sender_email, sender_phone, ip, meta").eq("tenant_id", tenantId).eq("id", from.id).maybeSingle();
      if (!e) return null;
      return { sender: { email: e.sender_email as string | null, phone: e.sender_phone as string | null, ip: e.ip as string | null, session: ((e.meta as { session?: string } | null)?.session) ?? null } };
    }
  }
}

/** Add or re-activate a rule. There's a unique index, so an insert race just keeps the first. */
async function saveRule(admin: Admin, rule: { tenantId: string | null; kind: BlockKind; value: string; effect: "block" | "allow"; reason?: string | null; userId: string; expiresAt?: string | null }) {
  const scoped = admin.from("contact_blocks").select("id").eq("kind", rule.kind).eq("value", rule.value);
  const { data: found } = await (rule.tenantId ? scoped.eq("tenant_id", rule.tenantId) : scoped.is("tenant_id", null)).maybeSingle();
  const row = { effect: rule.effect, reason: rule.reason ?? null, created_by: rule.userId, expires_at: rule.expiresAt ?? null };
  if (found) await admin.from("contact_blocks").update(row).eq("id", found.id);
  else await admin.from("contact_blocks").insert({ ...row, tenant_id: rule.tenantId, kind: rule.kind, value: rule.value });
}

/** Contacts on this site for this sender. Exact stored values: upsertContact keeps them normalised. */
async function contactsOf(admin: Admin, tenantId: string, sender: Sender, knownId?: string | null): Promise<string[]> {
  const ids = new Set<string>(knownId ? [knownId] : []);
  const email = sender.email?.trim().toLowerCase();
  const phone = normalizePhone(sender.phone);
  if (email) for (const c of (await admin.from("contacts").select("id").eq("tenant_id", tenantId).eq("email", email)).data ?? []) ids.add(c.id as string);
  if (phone) for (const c of (await admin.from("contacts").select("id").eq("tenant_id", tenantId).eq("phone", phone)).data ?? []) ids.add(c.id as string);
  return [...ids];
}

/** Clear what this sender already left on the site: inbox entries, follow-ups, chats, unread alerts. */
async function sweep(admin: Admin, tenantId: string, resolved: Resolved, banIp: boolean) {
  const { sender } = resolved;
  const email = emailKey(sender.email), phone = phoneKey(sender.phone), ip = banIp ? sender.ip : null;

  const { data: subs } = await admin.from("contact_form_submissions").select("id, form_id, data, ip, created_at, contact_forms(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(500);
  for (const s of subs ?? []) {
    const who = extractIdentity((s.data ?? {}) as Record<string, string>);
    const same = (email && emailKey(who.email) === email) || (phone && phoneKey(who.phone) === phone) || (ip && s.ip === ip);
    if (!same) continue;
    const form = (Array.isArray(s.contact_forms) ? s.contact_forms[0] : s.contact_forms) as { name?: string } | null;
    await recordSpam(admin, { tenantId, source: "form", reason: "banned", sender: { email: who.email, phone: who.phone, ip: s.ip as string | null }, data: s.data as Record<string, unknown>, meta: { form_name: form?.name ?? "Contact", sent_at: s.created_at } });
    await admin.from("contact_form_submissions").delete().eq("id", s.id);
  }

  const contactIds = await contactsOf(admin, tenantId, sender, resolved.contactId);
  for (const id of contactIds) {
    const { data: c } = await admin.from("contacts").select("tags").eq("id", id).maybeSingle();
    const tags = new Set<string>((c?.tags as string[] | null) ?? []);
    tags.add("blocked");
    await admin.from("contacts").update({ tags: [...tags], consent_email: false, consent_whatsapp: false, updated_at: new Date().toISOString() }).eq("id", id);
  }
  if (contactIds.length) {
    await admin.from("crm_sequence_runs").update({ status: "stopped", stop_reason: "banned", updated_at: new Date().toISOString() }).eq("tenant_id", tenantId).in("contact_id", contactIds).eq("status", "active");
  }

  type ChatRow = { id: string; session_id: string | null; ip: string | null; last_message: string | null };
  const chats = new Map<string, ChatRow>();
  const cols = "id, session_id, ip, last_message, blocked_at";
  const addChats = (rows: unknown[] | null) => { for (const r of (rows ?? []) as ChatRow[]) chats.set(r.id, r); };
  if (resolved.conversationId) addChats((await admin.from("site_chat_conversations").select(cols).eq("tenant_id", tenantId).eq("id", resolved.conversationId)).data);
  if (sender.session) addChats((await admin.from("site_chat_conversations").select(cols).eq("tenant_id", tenantId).eq("session_id", sender.session)).data);
  if (ip) addChats((await admin.from("site_chat_conversations").select(cols).eq("tenant_id", tenantId).eq("ip", ip).is("blocked_at", null).limit(50)).data);
  if (contactIds.length) addChats((await admin.from("site_chat_conversations").select(cols).eq("tenant_id", tenantId).in("lead_contact_id", contactIds)).data);
  const now = new Date().toISOString();
  for (const c of chats.values()) {
    await admin.from("site_chat_conversations").update({ blocked_at: now, unread_owner: 0, status: "closed", human_requested_at: null }).eq("id", c.id);
    await recordSpam(admin, { tenantId, source: "chat", reason: "banned", sender: { email: sender.email, phone: sender.phone, ip: c.ip, session: c.session_id }, data: { message: c.last_message ?? "" }, meta: { conversation_id: c.id } });
  }

  const alertIds = [...contactIds, ...chats.keys()];
  if (alertIds.length) await admin.from("admin_notifications").update({ read_at: now }).eq("tenant_id", tenantId).is("read_at", null).in("data->>id", alertIds);
}

export type BanResult = { ok: true; ipSkipped: boolean } | { ok: false; error: string };

export async function banSender(admin: Admin, input: BanInput): Promise<BanResult> {
  const resolved = await resolveSender(admin, input.tenantId, input.from);
  if (!resolved) return { ok: false, error: "Not found" };
  // A shared mobile IP banned everywhere would silently cost other clients real customers.
  const scope = input.scope === "all" ? "all" : "site";
  const wantsIp = !!input.banIp;
  const ipSkipped = wantsIp && scope === "all" && !input.platform;
  const banIp = wantsIp && !!resolved.sender.ip;
  const keys = senderKeys({ ...resolved.sender, ip: null });
  const rules: { kind: BlockKind; value: string; tenantId: string | null; expiresAt: string | null }[] = keys.map((k) => ({ ...k, tenantId: scope === "all" ? null : input.tenantId, expiresAt: null }));
  if (banIp) {
    const days = input.ipDays ?? DEFAULT_IP_BAN_DAYS;
    const [ipKey] = senderKeys({ ip: resolved.sender.ip });
    if (ipKey) rules.push({ ...ipKey, tenantId: ipSkipped ? input.tenantId : scope === "all" ? null : input.tenantId, expiresAt: days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null });
  }
  if (!rules.length) return { ok: false, error: "This entry has no email, phone or visitor to ban. Try banning the IP address." };
  for (const r of rules) await saveRule(admin, { ...r, effect: "block", reason: input.reason, userId: input.userId });
  await sweep(admin, input.tenantId, resolved, banIp);
  return { ok: true, ipSkipped };
}

/** Add a rule by hand from the Blocked list. Site only, unless platform. */
export async function blockValue(admin: Admin, input: { tenantId: string; userId: string; platform: boolean; kind: BlockKind; value: string; scope?: "site" | "all"; days?: number; reason?: string | null }): Promise<BanResult> {
  const key = input.kind === "email" ? emailKey(input.value)
    : input.kind === "phone" ? phoneKey(input.value)
    : input.kind === "ip" && /^[0-9a-f:.]{3,45}$/i.test(input.value.trim()) ? input.value.trim().toLowerCase() : null;
  if (!key) return { ok: false, error: `That is not a valid ${input.kind}.` };
  const global = input.scope === "all" && input.platform;
  const expiresAt = input.kind === "ip" && (input.days ?? DEFAULT_IP_BAN_DAYS) > 0 ? new Date(Date.now() + (input.days ?? DEFAULT_IP_BAN_DAYS) * 86_400_000).toISOString() : null;
  await saveRule(admin, { tenantId: global ? null : input.tenantId, kind: input.kind, value: key, effect: "block", reason: input.reason, userId: input.userId, expiresAt });
  return { ok: true, ipSkipped: false };
}

/** Bring a sender's chats and CRM contacts back once they are no longer banned. */
async function reinstate(admin: Admin, tenantId: string, sender: Sender) {
  for (const id of await contactsOf(admin, tenantId, sender)) {
    const { data: c } = await admin.from("contacts").select("tags").eq("id", id).maybeSingle();
    await admin.from("contacts").update({ tags: ((c?.tags as string[] | null) ?? []).filter((t) => t !== "blocked") }).eq("id", id);
  }
  if (sender.session) await admin.from("site_chat_conversations").update({ blocked_at: null }).eq("tenant_id", tenantId).eq("session_id", sender.session);
}

export async function unblock(admin: Admin, input: { tenantId: string; userId: string; platform: boolean; id: string }): Promise<BanResult> {
  const { data: row } = await admin.from("contact_blocks").select("id, tenant_id, kind, value, created_by").eq("id", input.id).maybeSingle();
  if (!row) return { ok: false, error: "Not found" };
  const mine = row.tenant_id === input.tenantId;
  const globalAllowed = row.tenant_id === null && (input.platform || row.created_by === input.userId);
  if (!mine && !globalAllowed) return { ok: false, error: "Forbidden" };
  await admin.from("contact_blocks").delete().eq("id", row.id);
  const kind = row.kind as BlockKind, value = row.value as string;
  if (kind === "visitor") await reinstate(admin, input.tenantId, { session: value });
  if (kind === "ip") await admin.from("site_chat_conversations").update({ blocked_at: null }).eq("tenant_id", input.tenantId).eq("ip", value);
  if (kind === "email" || kind === "phone") {
    const { data: entries } = await admin.from("spam_entries").select("sender_email, sender_phone, meta").eq("tenant_id", input.tenantId).eq("reason", "banned").limit(200);
    for (const e of entries ?? []) {
      const hit = kind === "email" ? emailKey(e.sender_email as string | null) === value : phoneKey(e.sender_phone as string | null) === value;
      if (hit) await reinstate(admin, input.tenantId, { email: e.sender_email as string | null, phone: e.sender_phone as string | null, session: (e.meta as { session?: string } | null)?.session ?? null });
    }
  }
  return { ok: true, ipSkipped: false };
}

/** "Not spam": undo the ban for this site and put the entry back where it came from. */
export async function restoreEntry(admin: Admin, input: { tenantId: string; userId: string; id: string }): Promise<BanResult> {
  const { data: e } = await admin.from("spam_entries").select("*").eq("tenant_id", input.tenantId).eq("id", input.id).maybeSingle();
  if (!e) return { ok: false, error: "Not found" };
  const meta = (e.meta ?? {}) as { session?: string; conversation_id?: string; form_name?: string; sent_at?: string };
  const sender: Sender = { email: e.sender_email as string | null, phone: e.sender_phone as string | null, ip: e.ip as string | null, session: meta.session ?? null };

  const keys = senderKeys(sender);
  if (keys.length) {
    const { data: rows } = await admin.from("contact_blocks").select("id, tenant_id, kind, value, effect").in("value", keys.map((k) => k.value)).or(`tenant_id.eq.${input.tenantId},tenant_id.is.null`);
    for (const r of rows ?? []) {
      if (!keys.some((k) => k.kind === r.kind && k.value === r.value) || r.effect !== "block") continue;
      // Only this site's rule can be removed here; a global one is overridden for this site.
      if (r.tenant_id) await admin.from("contact_blocks").delete().eq("id", r.id);
      else await saveRule(admin, { tenantId: input.tenantId, kind: r.kind as BlockKind, value: r.value as string, effect: "allow", userId: input.userId });
    }
  }
  await reinstate(admin, input.tenantId, sender);

  if (e.source === "form") {
    const fields = (e.data ?? {}) as Record<string, string>;
    const form = await formRow(admin, input.tenantId, meta.form_name ?? "Contact");
    if (form) {
      await admin.from("contact_form_submissions").insert({
        form_id: form.id, tenant_id: input.tenantId, data: fields, ip: e.ip,
        sender_email: emailKey(sender.email), sender_phone: phoneKey(sender.phone),
        ...(meta.sent_at ? { created_at: meta.sent_at } : {}),
      });
    }
    const who = extractIdentity(fields);
    await upsertContact({
      tenantId: input.tenantId, email: who.email, phone: who.phone, name: who.name, source: "form", consentEmail: !!who.email,
      event: { type: "form_submission", title: `Form: ${meta.form_name ?? "Contact"}`, body: Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n"), meta: { fields } },
    }).catch(() => null);
  }
  if (e.source === "chat" && meta.conversation_id) {
    await admin.from("site_chat_conversations").update({ blocked_at: null, status: "open" }).eq("tenant_id", input.tenantId).eq("id", meta.conversation_id);
  }
  await admin.from("spam_entries").delete().eq("id", e.id);
  return { ok: true, ipSkipped: false };
}
