/**
 * Website chat job intake: opt-in, tenant isolation, prompt-injected tool calls,
 * availability and double booking, spam, wording, wa.me messages, the photo route.
 * Run: npx tsx --test tests/site-chat/intake.test.ts
 */
import "../platform/pm-test-env";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { session, sent, mail } from "../platform/pm-test-env";
import { FakeDb } from "../mcp/fake-supabase";

const T = "aaaaaaaa-0000-4000-8000-000000000001";
const OTHER = "bbbbbbbb-0000-4000-8000-000000000002";
const CONV = "cccccccc-0000-4000-8000-000000000003";

// Nothing here may reach a real service.
function stub(id: string, exports: Record<string, unknown>) {
  const filename = require.resolve(id);
  require.cache[filename] = { id: filename, filename, loaded: true, exports, children: [], paths: [] } as unknown as NodeJS.Module;
}
const guard = { banned: false, spam: [] as unknown[], blockedArgs: [] as unknown[] };
stub("../../src/lib/spam/guard", {
  isBlockedSender: async (_t: string, s: unknown) => { guard.blockedArgs.push(s); return guard.banned; },
  findBlock: async () => null,
  recordSpam: async (_a: unknown, e: unknown) => { guard.spam.push(e); },
});
stub("../../src/lib/crm/sequences", { enrollInSequences: async () => undefined });
stub("../../src/lib/email/sender", { getSiteSender: async () => ({}) });
const stored: File[] = [];
stub("../../src/lib/media/upload", {
  MEDIA_BUCKET: "media",
  storeMediaFile: async (_a: unknown, tenantId: string, file: File, opts: { folder?: string }) => {
    stored.push(file);
    return { url: `https://cdn.test/${tenantId}/${file.name}`, width: 10, height: 10, size: file.size, originalSize: file.size, mime_type: file.type, name: file.name, folder: opts.folder };
  },
});

type Rules = typeof import("../../src/lib/site-chat/intake-rules");
type Copy = typeof import("../../src/lib/site-chat/intake-copy");
type Intake = typeof import("../../src/lib/site-chat/intake");
type Ai = typeof import("../../src/lib/site-chat/ai");
let rules: Rules, copy: Copy, intake: Intake, ai: Ai;
before(async () => {
  rules = await import("../../src/lib/site-chat/intake-rules");
  copy = await import("../../src/lib/site-chat/intake-copy");
  intake = await import("../../src/lib/site-chat/intake");
  ai = await import("../../src/lib/site-chat/ai");
});

/** A Monday far enough ahead that no notice period or clock matters. */
const MONDAY = (() => { const d = new Date(Date.now() + 7 * 86_400_000); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
const SUNDAY = (() => { const d = new Date(`${MONDAY}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 6); return d.toISOString().slice(0, 10); })();

function world(over: { confirmation_mode?: string; enabled?: boolean } = {}) {
  const db = new FakeDb({
    tenants: [
      { id: T, name: "Your Business", slug: "yourbusiness", owner_id: "owner", plan: "pro", site_chat_enabled: true, site_chat_intake: { enabled: true, word: "site visit" } },
      { id: OTHER, name: "Other Business", slug: "other", owner_id: "owner2", plan: "pro", site_chat_enabled: true, site_chat_intake: null },
    ],
    site_settings: [{ tenant_id: T, timezone: "Asia/Singapore" }],
    tenant_business_profiles: [{ tenant_id: T, country_code: "SG" }],
    profiles: [{ id: "owner", email: "owner@example.test" }],
    booking_settings: [
      { tenant_id: T, enabled: over.enabled ?? true, slot_duration_mins: 60, buffer_mins: 0, advance_days: 60, min_notice_hours: 4, confirmation_mode: over.confirmation_mode ?? "manual", service_name: "Appointment", notify_email: "owner@example.test", contact_requirement: "either" },
      { tenant_id: OTHER, enabled: true, slot_duration_mins: 60, advance_days: 60, min_notice_hours: 0, confirmation_mode: "manual", notify_email: "other@example.test" },
    ],
    booking_availability: Array.from({ length: 7 }, (_, d) => ({ tenant_id: T, day_of_week: d, open_time: "09:00", close_time: "12:00", is_open: d !== 0 })),
    booking_blocked_dates: [],
    booking_appointments: [],
    contacts: [],
    contact_events: [],
    crm_stages: [],
    site_chat_conversations: [{ id: CONV, tenant_id: T, session_id: "sess-1", ip: "9.9.9.9", started_at: new Date().toISOString(), intake: null, unread_owner: 0 }],
    site_chat_messages: [],
    media: [],
    spam_entries: [],
  });
  session.db = db;
  sent.length = 0; mail.length = 0; guard.banned = false; guard.spam.length = 0; guard.blockedArgs.length = 0; stored.length = 0;
  return db;
}

const run = (db: FakeDb, o: Partial<Parameters<Intake["createIntakeRun"]>[0]> = {}) => intake.createIntakeRun({
  admin: db as never, tenantId: T, conversationId: CONV, sessionId: "sess-1", ip: "9.9.9.9", siteName: "Your Business", word: "site visit", lang: "en",
  businessWhatsapp: "6581112222", existing: null, transcript: () => "Visitor: my kitchen", ...o,
});

const VISIT = () => ({ name: "Ali Rahman", phone: "91234567", email: "ali@example.test", work_type: "Kitchen renovation", property_type: "HDB 4-room", location: "Bedok", budget: "SGD 20k", details: "Old cabinets", summary_en: "Kitchen renovation in a Bedok flat", date: MONDAY, time: "10:00" });

// ---------------------------------------------------------------- settings ---

test("off unless the site opted in: anything but enabled:true stays old behaviour", () => {
  for (const v of [null, undefined, {}, { enabled: false, word: "site visit" }, { enabled: "true" }, "on", 1]) assert.equal(rules.parseIntakeSettings(v), null);
  assert.deepEqual(rules.parseIntakeSettings({ enabled: true }), { enabled: true, word: "site visit" });
  assert.equal(rules.parseIntakeSettings({ enabled: true, word: "inspection" })?.word, "inspection");
  assert.equal(rules.parseIntakeSettings({ enabled: true, word: "appointment" })?.word, "appointment", "a non-contractor site keeps its own word");
  assert.equal(rules.parseIntakeSettings({ enabled: true, word: "<script>x" })?.word, "site visit");
});

test("the chat's tools only change for an opted-in site", async () => {
  const db = world();
  const bodies: { tools: { function: { name: string } }[] }[] = [];
  const real = globalThis.fetch;
  process.env.OPENROUTER_API_KEY = "test";
  globalThis.fetch = (async (_u: unknown, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: "Hello" }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`);
  }) as never;
  try {
    const base = { admin: db as never, tenantId: T, siteName: "S", conversationId: CONV, sessionId: "s", system: "x", history: [], transcriptText: () => "", onDelta: () => undefined };
    await ai.runAiTurn(base);
    await ai.runAiTurn({ ...base, intake: await run(db) });
  } finally { globalThis.fetch = real; }
  const names = (i: number) => bodies[i].tools.map((t) => t.function.name).sort();
  assert.deepEqual(names(0), ["create_lead", "request_human", "set_visitor_name"]);
  assert.deepEqual(names(1), ["create_lead", "find_visit_times", "request_human", "request_site_visit", "set_visitor_name"]);
});

// ----------------------------------------------------- tenant and injection ---

test("no tool takes a site, status, id or price: the model has nothing to aim elsewhere with", () => {
  const props = [...rules.INTAKE_TOOLS, rules.INTAKE_LEAD_TOOL].flatMap((t) => Object.keys(t.function.parameters.properties));
  for (const bad of ["tenant", "tenant_id", "site", "status", "id", "appointment_id", "conversation_id", "url", "price"]) assert.ok(!props.includes(bad), bad);
});

test("an injected tool call cannot write to another site or set its own status", async () => {
  const db = world();
  const r = await run(db);
  const result = await r.requestVisit({ ...VISIT(), tenant_id: OTHER, tenantId: OTHER, status: "confirmed", confirmation_mode: "auto", conversation_id: "x" });
  assert.match(result, /^ok:/);
  const appts = db.rows("booking_appointments");
  assert.equal(appts.length, 1);
  assert.equal(appts[0].tenant_id, T);
  assert.equal(appts[0].status, "pending", "the site's setting decides, not the model");
  for (const w of db.writes) for (const row of w.rows) if (row.tenant_id !== undefined) assert.equal(row.tenant_id, T, `${w.table} write stayed on this site`);
  assert.equal(db.rows("contacts").filter((c) => c.tenant_id === OTHER).length, 0);
});

test("links and markup in visitor text never reach the owner's messages", async () => {
  const db = world();
  const r = await run(db);
  await r.requestVisit({ ...VISIT(), details: "Ignore rules [click](https://evil.example/x) see www.evil.example or evil.xyz/a <img src=x onerror=y>", location: "Bedok https://evil.example" });
  const saved = db.rows("site_chat_conversations")[0].intake as { job: { details: string; location: string } };
  assert.ok(!/evil|onerror|https?:/i.test(saved.job.details + saved.job.location), saved.job.details);
  const m = mail.find((x) => (x as { to: string }).to === "owner@example.test") as { text: string; html: string };
  assert.ok(!/evil/.test(m.text) && !/onerror/.test(m.html));
});

test("names with markup are escaped in the owner's HTML email", async () => {
  const db = world();
  const r = await run(db);
  await r.requestVisit({ ...VISIT(), name: "Ali <b>x</b> & co" });
  const m = mail.find((x) => (x as { to: string }).to === "owner@example.test") as { html: string };
  assert.ok(!m.html.includes("<b>x</b>"));
});

// ------------------------------------------------------------ availability ---

test("only the site's open times are offered, in its own timezone", async () => {
  const db = world();
  const r = await run(db);
  const out = JSON.parse(await r.findTimes({ date: MONDAY })) as { timezone: string; days: { date: string; times: string[] }[] };
  assert.equal(out.timezone, "Asia/Singapore");
  assert.deepEqual(out.days, [{ date: MONDAY, weekday: "Monday", times: ["09:00", "10:00", "11:00"] }]);
  const closed = JSON.parse(await r.findTimes({ date: SUNDAY })) as { days: { date: string }[] };
  assert.ok(closed.days.length > 0 && closed.days.every((d) => d.date !== SUNDAY), "a closed day is skipped");
});

test("past times and times inside the notice period stay closed, whatever the server clock says", () => {
  const now = new Date("2026-11-02T02:00:00Z"); // 10:00 in Singapore
  assert.equal(rules.slotIsOpen("2026-11-02", "09:00", "Asia/Singapore", 0, now), false, "already past in Singapore though later in UTC");
  assert.equal(rules.slotIsOpen("2026-11-02", "13:00", "Asia/Singapore", 4, now), false, "inside the notice period");
  assert.equal(rules.slotIsOpen("2026-11-02", "15:00", "Asia/Singapore", 4, now), true);
  assert.equal(rules.slotIsOpen("2026-11-03", "09:00", "Asia/Singapore", 4, now), true);
  assert.equal(rules.zonedNow("Not/AZone", now).tz, "UTC");
});

test("a time outside the hours, on a closed day or invented by the model is refused", async () => {
  const db = world();
  const r = await run(db);
  assert.match(await r.requestVisit({ ...VISIT(), time: "22:00" }), /^error: that time/);
  assert.match(await r.requestVisit({ ...VISIT(), date: SUNDAY }), /^error: that time/);
  assert.match(await r.requestVisit({ ...VISIT(), date: "2020-01-06" }), /^error: that time is no longer open/);
  assert.match(await r.requestVisit({ ...VISIT(), date: "next tuesday" }), /^error: choose a date/);
  assert.match(await r.requestVisit({ ...VISIT(), date: `${MONDAY.slice(0, 8)}45` }), /^error: choose a date/);
  assert.equal(db.rows("booking_appointments").length, 0);
});

test("no double booking: a taken time is refused and the model is told to offer others", async () => {
  const db = world();
  assert.match(await (await run(db)).requestVisit(VISIT()), /^ok:/);
  const CONV2 = "cccccccc-0000-4000-8000-000000000004";
  db.rows("site_chat_conversations").push({ id: CONV2, tenant_id: T, session_id: "sess-2", ip: "8.8.8.8", intake: null });
  const second = await (await run(db, { conversationId: CONV2, sessionId: "sess-2", ip: "8.8.8.8" })).requestVisit({ ...VISIT(), name: "Second Person", phone: "+6598887777", email: "" });
  assert.match(second, /^error: that time was just taken/);
  assert.equal(db.rows("booking_appointments").length, 1);
});

test("two people racing for one time: the earlier one keeps it, the later one steps back", async () => {
  const db = world();
  db.onInsert = (table, row, all) => {
    // The rival lands between our slot check and our insert.
    if (table === "booking_appointments" && !all.length) all.push({ id: "rival", tenant_id: T, date: row.date, start_time: row.start_time, end_time: row.end_time, status: "pending", created_at: "2000-01-01T00:00:00Z" });
    return null;
  };
  const res = await (await run(db)).requestVisit(VISIT());
  assert.match(res, /^error: that time was just taken/);
  assert.deepEqual(db.rows("booking_appointments").map((a) => a.id), ["rival"]);
  assert.equal(sent.length, 0, "the owner hears nothing about the request that stepped back");
});

test("one request per chat, even if the model calls the tool again", async () => {
  const db = world();
  const r = await run(db);
  await r.requestVisit(VISIT());
  assert.match(await r.requestVisit({ ...VISIT(), time: "11:00" }), /already saved/);
  const fresh = await run(db, { existing: db.rows("site_chat_conversations")[0].intake });
  assert.match(await fresh.requestVisit({ ...VISIT(), time: "11:00" }), /already saved/);
  assert.equal(db.rows("booking_appointments").length, 1);
  assert.equal(sent.length, 1);
});

test("bookings off: no time offered, and the request falls back to a lead", async () => {
  const db = world({ enabled: false });
  const r = await run(db);
  assert.match(await r.findTimes({}), /^unavailable/);
  assert.match(await r.requestVisit(VISIT()), /^unavailable/);
  assert.match(await r.saveLead({ ...VISIT(), preferred_time: "weekday mornings" }), /^ok:/);
  assert.equal(db.rows("booking_appointments").length, 0);
  assert.equal(db.rows("contacts").length, 1);
  const n = sent[0] as { input: { type: string; title: string } };
  assert.equal(n.input.type, "lead");
});

test("auto-confirm sites say confirmed; manual sites say requested", async () => {
  const manual = world();
  assert.match(await (await run(manual)).requestVisit(VISIT()), /waiting for the team to confirm.*not confirmed/);
  const auto = world({ confirmation_mode: "auto" });
  const res = await (await run(auto)).requestVisit(VISIT());
  assert.match(res, /is confirmed for/);
  assert.equal(auto.rows("booking_appointments")[0].status, "confirmed");
});

// -------------------------------------------------------------------- spam ---

test("banned sender: same answer, nothing saved, nobody alerted", async () => {
  const db = world();
  guard.banned = true;
  const res = await (await run(db)).requestVisit(VISIT());
  assert.match(res, /^ok:/);
  assert.equal(db.rows("booking_appointments").length + db.rows("contacts").length, 0);
  assert.equal(sent.length + mail.length, 0);
  assert.ok(db.rows("site_chat_conversations")[0].blocked_at);
  assert.deepEqual(guard.blockedArgs[0], { email: "ali@example.test", phone: "+6591234567", ip: "9.9.9.9", session: "sess-1" }, "email, phone, IP and session are all checked");
});

test("bot pattern: same answer, goes to spam, nothing saved", async () => {
  const db = world();
  const res = await (await run(db)).saveLead({ ...VISIT(), name: "HvDgeyDtVYhfSOPOwoFNhJX", work_type: "wJqLmZpXyTrNvBkQs" });
  assert.match(res, /^ok:/);
  assert.equal(db.rows("contacts").length, 0);
  assert.equal(guard.spam.length, 1);
});

test("one IP can only save a few requests a day on a site", async () => {
  const db = world();
  const started = new Date().toISOString();
  for (let i = 0; i < rules.MAX_REQUESTS_PER_IP_DAY; i++) db.rows("site_chat_conversations").push({ id: `old-${i}`, tenant_id: T, session_id: `o${i}`, ip: "9.9.9.9", started_at: started, intake: { kind: "lead" } });
  assert.match(await (await run(db)).requestVisit(VISIT()), /^error: too many/);
  assert.equal(db.rows("booking_appointments").length, 0);
});

// ----------------------------------------------- the lead and who hears it ---

test("the visit creates one appointment and one lead, and the owner's alert carries wa.me", async () => {
  const db = world();
  db.rows("site_chat_messages").push({ tenant_id: T, conversation_id: CONV, role: "visitor", body: "[Photo] u", meta: { photos: [{ url: "https://cdn.test/a.webp" }] } });
  const r = await run(db);
  await r.requestVisit(VISIT());

  const [appt] = db.rows("booking_appointments");
  assert.equal(appt.visit_label, "site visit");
  assert.equal(appt.chat_conversation_id, CONV);
  assert.equal(appt.customer_phone, "+6591234567", "a local Singapore number gets its country code");
  assert.match(String(appt.message), /Kitchen renovation[\s\S]*cdn\.test\/a\.webp/);

  const [contact] = db.rows("contacts");
  assert.equal(contact.source, "ai_chat");
  assert.deepEqual(contact.tags, ["ai-chat", "site-visit"]);
  assert.equal((contact.custom as { job: { location: string } }).job.location, "Bedok");
  assert.match(String(db.rows("contact_events")[0].body), /Budget: SGD 20k[\s\S]*Chat transcript/);
  assert.equal(db.rows("site_chat_conversations")[0].lead_contact_id, contact.id);

  // One alert, not one per system.
  assert.equal(sent.length, 1);
  const push = (sent[0] as { input: { type: string; title: string; body: string; webUrl: string; path: string } }).input;
  assert.equal(push.type, "booking");
  assert.equal(push.title, "New site visit request: Ali Rahman");
  assert.match(push.body, /Kitchen renovation in a Bedok flat/);
  assert.equal(push.path, `chat/${CONV}`);
  assert.ok(push.webUrl.startsWith("https://wa.me/6591234567?text="), push.webUrl);

  const owner = mail.find((m) => (m as { to: string }).to === "owner@example.test") as { subject: string; text: string; html: string };
  assert.match(owner.subject, /^New site visit request: Ali Rahman/);
  assert.match(owner.text, /https:\/\/wa\.me\/6591234567\?text=/);
  assert.match(owner.text, /https:\/\/wa\.me\/\?text=/, "forward link");
  assert.match(owner.text, /for you to check and send/);
  assert.match(owner.html, /wa\.me/);

  // The customer's own email, in the site's word.
  const customer = mail.find((m) => (m as { to: string }).to === "ali@example.test") as { subject: string; text: string };
  assert.match(customer.subject, /site visit/);
  assert.ok(!/booking/i.test(customer.subject + customer.text.split("/book/manage")[0]));

  // The visitor's card and button.
  const card = r.card()!;
  assert.equal(card.kind, "visit");
  assert.equal(card.status, "pending");
  assert.ok(card.whatsapp!.startsWith("https://wa.me/6581112222?text="));
  const text = decodeURIComponent(card.whatsapp!.split("text=")[1]);
  assert.match(text, /site visit/);
  assert.match(text, /Kitchen renovation/);
  assert.match(text, /cdn\.test\/a\.webp/, "photos travel in the visitor's message");
  assert.ok(card.manageUrl?.includes("/book/manage/"));
});

test("no business WhatsApp number: no visitor button, the rest still works", async () => {
  const db = world();
  const r = await run(db, { businessWhatsapp: null });
  await r.requestVisit(VISIT());
  assert.equal(r.card()!.whatsapp, null);
  assert.equal(sent.length, 1);
});

test("a saved request survives a model that goes quiet", async () => {
  const db = world();
  const r = await run(db);
  assert.equal(r.fallback(), null);
  await r.requestVisit(VISIT());
  assert.match(r.fallback()!, /site visit request is saved/);
});

test("say site visit, never booking, in everything people see", () => {
  const job = { work_type: "Kitchen", property_type: "", location: "Bedok", budget: "", details: "", summary_en: "Kitchen" };
  const contact = { name: "Ali", phone: "+6591234567", email: "" };
  for (const word of ["site visit", "inspection"]) {
    const f = { kind: "visit" as const, word, siteName: "Your Business", contact, job, photos: [], when: "Mon 3 Nov, 10:00", status: "pending" as const, lang: "en" as const };
    const c = copy.intakeCopy("en");
    const card = { kind: "visit" as const, lang: "en" as const, word, when: f.when, status: "pending" as const, whatsapp: null, manageUrl: null };
    const seen = [rules.ownerReplyText(f), rules.visitorWhatsappText(f), rules.forwardText(f), rules.ownerLines(f).join(" "), c.visitTitle(card), c.visitNote(card), c.sendWhatsapp,
      rules.visitCustomerEmail({ lang: "en", word, name: "Ali", when: f.when, status: "pending", manageUrl: "https://x.test", depositLines: [] }).text].join(" ");
    assert.ok(!/booking|appointment/i.test(seen), seen);
    assert.ok(seen.toLowerCase().includes(word));
    assert.match(rules.intakePrompt(word), new RegExp(`Call it a "${word}".*never by another name such as booking`));
  }
});

test("a non-contractor site's own word carries through", () => {
  const f = { kind: "visit" as const, word: "appointment", siteName: "Your Business", contact: { name: "Ali", phone: "+6591234567", email: "" }, job: { work_type: "", property_type: "", location: "", budget: "", details: "", summary_en: "" }, photos: [], when: "Mon 3 Nov, 10:00", status: "pending" as const, lang: "en" as const };
  assert.match(rules.ownerReplyText(f), /your appointment request/);
  assert.match(copy.intakeCopy("en").visitTitle({ kind: "visit", lang: "en", word: "appointment", when: null, status: "pending", whatsapp: null, manageUrl: null }), /^Appointment requested/);
});

test("Arabic: visitor-facing copy and messages are in Arabic with the site's word translated", () => {
  assert.equal(rules.intakeLang("ar", "hello"), "ar");
  assert.equal(rules.intakeLang(null, "أريد ترميم المطبخ"), "ar");
  assert.equal(rules.intakeLang(null, "kitchen"), "en");
  assert.equal(rules.intakeLang("en", "أريد"), "en", "a language picked in the widget wins");
  assert.equal(copy.localWord("site visit", "ar"), "زيارة الموقع");
  assert.equal(copy.localWord("inspection", "ar"), "المعاينة");
  const f = { kind: "visit" as const, word: "site visit", siteName: "Your Business", contact: { name: "علي", phone: "+97433334444", email: "" }, job: { work_type: "ترميم مطبخ", property_type: "", location: "الدوحة", budget: "", details: "", summary_en: "Kitchen renovation in Doha" }, photos: [], when: rules.fmtWhen("2026-11-03", "10:00", "ar"), status: "pending" as const, lang: "ar" as const };
  assert.match(rules.visitorWhatsappText(f), /زيارة الموقع/);
  assert.ok(!/Mon|Nov/.test(rules.visitorWhatsappText(f)), "the date is in Arabic too");
  const staffRead = { ...f, when: "Tue 3 Nov, 10:00", whenLocal: rules.fmtWhen("2026-11-03", "10:00", "ar") };
  assert.ok(!/Tue|Nov/.test(rules.visitorWhatsappText(staffRead) + rules.ownerReplyText(staffRead)), "what the visitor reads never shows the English date");
  assert.match(rules.ownerLines(staffRead).join(" "), /Tue 3 Nov, 10:00/, "the team's own lines stay in English");
  assert.match(rules.ownerReplyText(f), /زيارة الموقع.*ترميم مطبخ/);
  assert.match(rules.fmtWhen("2026-11-03", "10:00", "ar"), /10:00/);
  const c = copy.intakeCopy("ar");
  assert.match(c.visitTitle({ kind: "visit", lang: "ar", word: "زيارة الموقع", when: null, status: "pending", whatsapp: null, manageUrl: null }), /تم طلب زيارة الموقع/);
});

test("phone numbers: local numbers get the site's country code, international ones are kept", () => {
  assert.equal(rules.withCountryCode("9123 4567", "65"), "+6591234567");
  assert.equal(rules.withCountryCode("+65 9123 4567", "65"), "+6591234567");
  assert.equal(rules.withCountryCode("0065 9123 4567", "65"), "+6591234567");
  assert.equal(rules.withCountryCode("6591234567", "65"), "+6591234567");
  assert.equal(rules.withCountryCode("65123456", "65"), "+6565123456", "a Singapore landline starting 65 is local");
  assert.equal(rules.withCountryCode("0501234567", "971"), "+971501234567");
  assert.equal(rules.withCountryCode("33334444", null), "33334444");
  assert.equal(rules.dialCodeFor("qa", null), "974");
  assert.equal(rules.dialCodeFor(null, "Asia/Singapore"), "65");
  assert.equal(rules.dialCodeFor(null, "UTC"), null);
});

test("WhatsApp is always a wa.me link a person taps", () => {
  assert.equal(rules.waLink("+65 9123", "a b&c"), "https://wa.me/659123?text=a%20b%26c");
  assert.ok(rules.waLink(null, "x").startsWith("https://wa.me/?text="));
  assert.ok(decodeURIComponent(rules.waLink("1", "z".repeat(5000)).split("text=")[1]).length <= 1500);
});

test("the prompt never makes a visitor re-enter a local number", () => {
  assert.match(rules.intakePrompt("site visit"), /a local number is fine, so never ask again for a country code/);
  const { phone } = rules.INTAKE_LEAD_TOOL.function.parameters.properties;
  assert.match(phone.description, /A local number is fine/);
});

test("Arabic visit: the card and the visitor's WhatsApp text use the Arabic date, the owner's alert the English one", async () => {
  const db = world();
  const r = await run(db, { lang: "ar" });
  await r.requestVisit({ ...VISIT(), name: "علي", location: "الدوحة", work_type: "ترميم مطبخ" });
  const card = r.card()!;
  assert.ok(!/Mon|Nov|Dec|Jan/.test(String(card.when)), String(card.when));
  assert.ok(!/ Mon | Nov/.test(decodeURIComponent(card.whatsapp!.split("text=")[1])));
  const saved = db.rows("site_chat_conversations")[0].intake as { when: string; owner_whatsapp: string };
  assert.match(saved.when, /^Mon /);
  assert.ok(!/ Mon /.test(decodeURIComponent(saved.owner_whatsapp.split("text=")[1])));
  assert.match((sent[0] as { input: { body: string } }).input.body, /Mon /);
});

test("contact and field validation", () => {
  assert.equal(rules.parseContact({ name: "", phone: "91234567" }).ok, false);
  assert.equal(rules.parseContact({ name: "A", phone: "12" }).ok, false);
  assert.equal(rules.parseContact({ name: "A", phone: "call me later" }).ok, false);
  const ok = rules.parseContact({ name: "Ali", phone: "+65 9123-4567", email: "not an email" });
  assert.ok(ok.ok && ok.value.email === "");
  assert.equal(rules.cleanDate("2026-02-30"), null);
  assert.equal(rules.cleanTime("9:05"), "09:05");
  assert.equal(rules.cleanTime("25:00"), null);
  assert.equal(rules.cleanWord("<b>x</b>"), "site visit");
});

test("the context tells the model the date, the message budget and what is saved", () => {
  const now = { date: "2026-11-03", time: "10:00", tz: "Asia/Singapore" };
  assert.match(rules.intakeContext({ now, left: 8, word: "site visit", saved: null }), /Tuesday 2026-11-03, 10:00 .*Asia\/Singapore.*left in this chat: 8\./);
  assert.match(rules.intakeContext({ now, left: 3, word: "site visit", saved: null }), /Few messages left/);
  assert.match(rules.intakeContext({ now, left: 3, word: "site visit", saved: { kind: "visit", when: "Mon 3 Nov, 10:00" } }), /already saved/);
});

test("a tool call in the model's stream runs against this site only, then the answer follows", async () => {
  const db = world();
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    const payload = calls === 1
      ? { choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", function: { name: "request_site_visit", arguments: JSON.stringify({ ...VISIT(), tenant_id: OTHER }) } }] }, finish_reason: "tool_calls" }] }
      : { choices: [{ delta: { content: "Your site visit is requested." }, finish_reason: "stop" }] };
    return new Response(`data: ${JSON.stringify(payload)}\n\ndata: [DONE]\n\n`);
  }) as never;
  try {
    const r = await ai.runAiTurn({ admin: db as never, tenantId: T, siteName: "S", conversationId: CONV, sessionId: "sess-1", system: "x", history: [], transcriptText: () => "", onDelta: () => undefined, intake: await run(db) });
    assert.equal(r.text, "Your site visit is requested.");
    assert.equal(r.visit?.kind, "visit");
    assert.ok(r.leadId);
  } finally { globalThis.fetch = real; }
  assert.equal(db.rows("booking_appointments")[0].tenant_id, T);
});

// ------------------------------------------------------------ photo upload ---

const png = () => sharp({ create: { width: 20, height: 20, channels: 3, background: "#884400" } }).withExif({ IFD0: { Copyright: "secret-location" } }).png().toBuffer();

async function postPhoto(db: FakeDb, file: File | null, o: { tenant?: string; session?: string } = {}) {
  session.db = db;
  const { POST } = await import("../../src/app/api/site-chat/photo/route");
  const fd = new FormData();
  fd.set("sessionId", o.session ?? "sess-1");
  if (file) fd.set("file", file);
  const req = new Request("https://yourbusiness.example.test/api/site-chat/photo", { method: "POST", body: fd, headers: { "x-tenant-id": o.tenant ?? T, host: "yourbusiness.example.test", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` } });
  const res = await POST(req as never);
  return { status: res.status, body: await res.json() as { ok: boolean; error?: string; message?: { meta: { photos: { url: string }[] } } } };
}

test("photo: stored for this site's chat, re-encoded, metadata dropped, random name", async () => {
  const db = world();
  const r = await postPhoto(db, new File([new Uint8Array(await png())], "my-house.png", { type: "image/png" }));
  assert.equal(r.status, 200);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].type, "image/webp");
  assert.match(stored[0].name, /^chat-[0-9a-f-]{36}\.webp$/, "the visitor's file name is not kept");
  const meta = await sharp(Buffer.from(await stored[0].arrayBuffer())).metadata();
  assert.equal(meta.exif, undefined);
  const [m] = db.rows("site_chat_messages");
  assert.equal(m.tenant_id, T);
  assert.equal(m.conversation_id, CONV);
  assert.equal((m.meta as { photos: unknown[] }).photos.length, 1);
});

test("photo: a file that only claims to be an image is refused", async () => {
  const db = world();
  const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
  assert.equal((await postPhoto(db, new File([html], "x.jpg", { type: "image/jpeg" }))).status, 400);
  assert.equal((await postPhoto(db, new File([html], "x.svg", { type: "image/svg+xml" }))).status, 400);
  assert.equal((await postPhoto(db, new File([await png() as never], "x.pdf", { type: "application/pdf" }))).status, 400);
  assert.equal(stored.length, 0);
  assert.equal(db.rows("site_chat_messages").length, 0);
});

test("photo: too large, too many, wrong site and sites that did not opt in are refused", async () => {
  const db = world();
  const big = new File([new Uint8Array(rules.MAX_PHOTO_BYTES + 1)], "big.jpg", { type: "image/jpeg" });
  assert.equal((await postPhoto(db, big)).status, 413);
  const good = new File([new Uint8Array(await png())], "a.png", { type: "image/png" });
  assert.equal((await postPhoto(db, good, { tenant: OTHER })).status, 403, "not opted in");
  assert.equal((await postPhoto(db, good, { session: "someone-elses-session" })).status, 404);
  db.rows("tenants")[1].site_chat_intake = { enabled: true };
  assert.equal((await postPhoto(db, good, { tenant: OTHER })).status, 404, "this session belongs to another site");
  for (let i = 0; i < rules.MAX_PHOTOS_PER_CHAT; i++) db.rows("site_chat_messages").push({ tenant_id: T, conversation_id: CONV, role: "visitor", body: "x", meta: { photos: [{ url: `u${i}` }] } });
  assert.equal((await postPhoto(db, good)).status, 400);
  assert.equal(stored.length, 0);
});

test("photo: banned visitor sees success, nothing stored", async () => {
  const db = world();
  guard.banned = true;
  const r = await postPhoto(db, new File([new Uint8Array(await png())], "a.png", { type: "image/png" }));
  assert.equal(r.status, 200);
  assert.equal(stored.length, 0);
  assert.equal(db.rows("site_chat_messages").length, 0);
});

test("photo sent after the lead was saved still reaches the lead's timeline", async () => {
  const db = world();
  db.rows("site_chat_conversations")[0].lead_contact_id = "lead-1";
  await postPhoto(db, new File([new Uint8Array(await png())], "a.png", { type: "image/png" }));
  const [e] = db.rows("contact_events");
  assert.equal(e.contact_id, "lead-1");
  assert.equal(e.tenant_id, T);
});

after(() => { delete process.env.OPENROUTER_API_KEY; });
