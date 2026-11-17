import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimited, clientIp } from "@/lib/rate-limit";
import { getSiteChatKnowledge } from "@/lib/site-chat/knowledge";
import { fileChunks, fileContext, type TrainingRow } from "@/lib/site-chat/training";
import { chatTenantFromRequest, siteChatFlags } from "@/lib/site-chat/config";
import { SITE_CHAT_LIMITS, siteChatToday } from "@/lib/site-chat/usage";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";
import { upsertContact } from "@/lib/crm/upsertContact";
import { runAiTurn, VISITOR_NAME_PROMPT, LEAD_CAPTURE_PROMPT } from "@/lib/site-chat/ai";
import { notifyTenantEvent } from "@/lib/push/notify";
import { alertHumanWanted } from "@/lib/site-chat/alerts";
import { humanHandoffPrompt, humanWaitReply, parseHours } from "@/lib/site-chat/hours";
import { findBlock, isBlockedSender, recordSpam } from "@/lib/spam/guard";
import { AI_MESSAGES_PER_VISITOR_DAY, NEW_CHAT_PUSHES_PER_DAY } from "@/lib/spam/rules";
import { createIntakeRun } from "@/lib/site-chat/intake";
import { intakeLang, intakePrompt } from "@/lib/site-chat/intake-rules";
import type { MessageMeta } from "@/lib/site-chat/intake-copy";

/** A human's last word (reply or join) older than this hands the chat back to the AI. */
const HUMAN_IDLE_MS = 5 * 60_000;

/** Languages the widget's picker offers (code -> name for the AI). */
const langPrompt = (code: string | null, justPicked: boolean) => {
  const name = code ? PICK_LANGS[code] : null;
  if (!name) return "";
  return `\n\nThe visitor chose to chat in ${name}. Reply only in ${name}, whatever language the site content is in.` +
    (justPicked ? ` Their last message is just the language choice: welcome them warmly in ${name} in one or two sentences and ask what they are looking for.` : "");
};
const PICK_LANGS: Record<string, string> = { en: "English", bn: "Bangla (Bengali script)", ar: "Arabic", hi: "Hindi", ur: "Urdu", ms: "Malay", zh: "Chinese (Simplified)" };

/**
 * Visitor side of the site chat (live chat on every plan, AI answers on
 * Pro/Biz when switched on). The tenant comes from the host, never the body.
 * History lives server-side (site_chat_messages); the browser keeps only its
 * session id, which is the conversation's secret.
 *
 *   POST { sessionId, message, page?, lang? }  -> SSE stream (AI) or JSON (live)
 *   GET  ?sessionId=&after=<iso>               -> messages since, agent, mode
 *
 *   POST { sessionId, lead: { name, phone, email? } } -> saves the visitor's
 *        details when the AI is out of credits and the team answers instead
 *
 * Limits, an off switch or a model failure never error: the answer is a
 * WhatsApp/phone handoff. Out of AI Credits the chat silently turns into live
 * chat with a contact form; the visitor never hears why.
 */

export const maxDuration = 60;

type Admin = Awaited<ReturnType<typeof createAdminClient>>;
const digits = (v: string | null | undefined) => (v ?? "").replace(/[^\d]/g, "");
const HUMAN_RE = /\b(human|real person|agent|staff|representative|talk to (a|some)one|operator)\b|মানুষ|এজেন্ট|إنسان|موظف/i;

async function contactFor(admin: Admin, tenantId: string) {
  const { data } = await admin.from("contact_details").select("phone, whatsapp").eq("tenant_id", tenantId)
    .order("is_primary", { ascending: false }).order("sort_order", { ascending: true }).limit(1).maybeSingle();
  return { whatsapp: digits(data?.whatsapp || data?.phone) || null, phone: data?.phone ?? null };
}
const handoffOf = (c: { whatsapp: string | null; phone: string | null }, q: string) => ({
  whatsapp: c.whatsapp ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(q.slice(0, 500))}` : null,
  phone: c.phone,
});

const pub = (m: Record<string, unknown>) => ({ id: m.id, role: m.role, body: m.body, author_name: m.author_name ?? null, created_at: m.created_at, ...(m.meta ? { meta: m.meta } : {}) });

export async function GET(req: NextRequest) {
  const tenantId = await chatTenantFromRequest(req);
  const sp = req.nextUrl.searchParams;
  const sessionId = (sp.get("sessionId") ?? "").slice(0, 64);
  if (!tenantId || !sessionId) return NextResponse.json({ messages: [] });
  const admin = await createAdminClient();
  const { data: conv } = await admin.from("site_chat_conversations").select("id, agent_name, agent_user_id, ai_paused, status")
    .eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle();
  if (!conv) return NextResponse.json({ messages: [] });
  let q = admin.from("site_chat_messages").select("id, role, body, author_name, created_at, meta").eq("conversation_id", conv.id).order("created_at").limit(200);
  const afterIso = sp.get("after");
  if (afterIso) q = q.gt("created_at", afterIso);
  const { data } = await q;
  return NextResponse.json({
    messages: (data ?? []).map(pub),
    agent: conv.agent_user_id ? { name: conv.agent_name ?? "Team" } : null,
    status: conv.status,
  }, { headers: { "Cache-Control": "no-store" } });
}

/** Out of AI Credits nobody asks for contact details in the conversation, so the widget's form does. */
async function saveLead(req: NextRequest, tenantId: string, sessionId: string, lead: Record<string, unknown>) {
  if (rateLimited(`site-chat:${clientIp(req)}`, 20, 10 * 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const name = typeof lead.name === "string" ? lead.name.trim().slice(0, 120) : "";
  const phone = typeof lead.phone === "string" ? lead.phone.trim().slice(0, 40) : "";
  const email = typeof lead.email === "string" ? lead.email.trim().slice(0, 200) : "";
  if (!name || digits(phone).length < 6) return NextResponse.json({ ok: false, error: "Please enter your name and phone number." }, { status: 400 });
  if (await isBlockedSender(tenantId, { email, phone, ip: clientIp(req), session: sessionId }, "site_chat_lead", { name, email, phone })) return NextResponse.json({ ok: true });
  const admin = await createAdminClient();
  const { data: conv } = await admin.from("site_chat_conversations").select("id, last_message").eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle();
  if (!conv) return NextResponse.json({ ok: false }, { status: 404 });
  const id = await upsertContact({
    tenantId, name, phone, email: email || null, source: "form", consentEmail: !!email, tags: ["website-chat"],
    event: { type: "note", title: "Website chat lead", body: String(conv.last_message ?? "").slice(0, 2000), meta: { source: "site_chat", session_id: sessionId, conversation_id: conv.id } },
  }).catch(() => null);
  if (!id) return NextResponse.json({ ok: false, error: "Could not save that. Please message us on WhatsApp." }, { status: 500 });
  await admin.from("site_chat_conversations").update({ lead_contact_id: id, visitor_name: name }).eq("id", conv.id);
  after(() => notifyTenantEvent({ tenantId, type: "lead", id, title: `New chat lead: ${name}`, body: String(conv.last_message ?? "").slice(0, 140) || "Open the dashboard to read it.", webUrl: "/dashboard/crm" }));
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const tenantId = await chatTenantFromRequest(req);
  const body = (await req.json().catch(() => ({}))) as { sessionId?: unknown; message?: unknown; page?: unknown; lang?: unknown; pickLang?: unknown; lead?: unknown };
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  if (tenantId && sessionId && body.lead && typeof body.lead === "object") return saveLead(req, tenantId, sessionId, body.lead as Record<string, unknown>);
  const message = typeof body.message === "string" ? body.message.trim().slice(0, SITE_CHAT_LIMITS.maxMessageChars) : "";
  if (!tenantId || !sessionId || !message) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const admin = await createAdminClient();
  const [contact, flags] = await Promise.all([contactFor(admin, tenantId), siteChatFlags(tenantId)]);
  const ip = clientIp(req);
  if (rateLimited(`site-chat:${ip}`, 20, 10 * 60_000)) {
    return NextResponse.json({ mode: "limit", reply: "You are sending messages very fast. Please continue with our team on WhatsApp.", handoff: handoffOf(contact, message) });
  }
  if (!flags?.widget) {
    return NextResponse.json({ mode: "off", reply: "Chat is not available right now. Please message us on WhatsApp.", handoff: handoffOf(contact, message) });
  }

  // Conversation: find or create.
  let { data: conv } = await admin.from("site_chat_conversations").select("*").eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle();
  const isNew = !conv;
  const banned = !!(await findBlock(admin, tenantId, { ip, session: sessionId }).catch(() => null));
  if (!conv) {
    const ins = await admin.from("site_chat_conversations").insert({
      tenant_id: tenantId, session_id: sessionId, ip,
      blocked_at: banned ? new Date().toISOString() : null,
      visitor_page: typeof body.page === "string" ? body.page.slice(0, 300) : null,
      visitor_lang: typeof body.lang === "string" ? body.lang.slice(0, 20) : null,
      visitor_country: req.headers.get("x-vercel-ip-country"),
    }).select("*").single();
    conv = ins.data ?? (await admin.from("site_chat_conversations").select("*").eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle()).data;
    if (!conv) return NextResponse.json({ mode: "error", reply: "Sorry, something went wrong. Please message us on WhatsApp.", handoff: handoffOf(contact, message) });
  }

  const now = new Date().toISOString();
  const { data: vm } = await admin.from("site_chat_messages").insert({ tenant_id: tenantId, conversation_id: conv.id, role: "visitor", body: message }).select("id, role, body, author_name, created_at").single();
  const count = Number(conv.message_count) + 1;
  // Banned: the visitor sees an ordinary waiting chat. No AI, no alerts, nothing in the inbox.
  if (banned || conv.blocked_at) {
    await admin.from("site_chat_conversations").update({ last_at: now, message_count: count, last_message: message.slice(0, 200), blocked_at: conv.blocked_at ?? now }).eq("id", conv.id);
    if (isNew || !conv.blocked_at) await recordSpam(admin, { tenantId, source: "chat", reason: "banned", sender: { ip, session: sessionId }, data: { message }, meta: { conversation_id: conv.id } }).catch(() => undefined);
    return NextResponse.json({ mode: "live", message: vm ? pub(vm) : null, replyMinutes: flags.replyMinutes, handoff: handoffOf(contact, message) });
  }
  const wantsHuman = HUMAN_RE.test(message);
  // Language picked in the widget: the AI welcomes them in it and keeps to it.
  const picked = typeof body.pickLang === "string" && PICK_LANGS[body.pickLang] ? body.pickLang : null;
  const chatLang = picked ?? (conv.chat_lang as string | null) ?? null;
  await admin.from("site_chat_conversations").update({
    last_at: now, message_count: count, last_message: message.slice(0, 200), unread_owner: Number(conv.unread_owner) + 1, status: "open",
    ...(typeof body.page === "string" ? { visitor_page: body.page.slice(0, 300) } : {}),
    ...(wantsHuman && !conv.human_requested_at ? { human_requested_at: now } : {}),
    ...(picked ? { chat_lang: picked } : {}),
  }).eq("id", conv.id);

  const siteName = flags.name || null;
  // Past a few new chats a day from one address, they still land in the inbox but stop buzzing.
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { count: chatsToday } = isNew ? await admin.from("site_chat_conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("ip", ip).gte("started_at", dayAgo) : { count: 0 };
  if (isNew && (chatsToday ?? 0) <= NEW_CHAT_PUSHES_PER_DAY) {
    after(() => notifyTenantEvent({ tenantId, type: "chat", id: conv!.id as string, title: "New website chat", body: message.slice(0, 140), path: `chat/${conv!.id}`, webUrl: "/dashboard/chat", dedupeKey: `chat-${conv!.id}` }));
  }

  // Who answers? AI only when on, not paused by a human, within limits.
  // A human who went quiet for 5 minutes hands the chat back automatically.
  let humanMode = !!conv.agent_user_id || !!conv.ai_paused;
  if (humanMode && flags.ai) {
    const { data: lastHuman } = await admin.from("site_chat_messages").select("created_at").eq("conversation_id", conv.id)
      .in("role", ["agent", "system"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!lastHuman || Date.now() - new Date(lastHuman.created_at as string).getTime() > HUMAN_IDLE_MS) {
      await admin.from("site_chat_conversations").update({ agent_user_id: null, agent_name: null, ai_paused: false, human_requested_at: null }).eq("id", conv.id);
      await admin.from("site_chat_messages").insert({ tenant_id: tenantId, conversation_id: conv.id, role: "system", body: "You are chatting with our AI assistant again" });
      conv.human_requested_at = null;
      humanMode = false;
    }
  }
  const { data: hoursRow } = await admin.from("tenants").select("site_chat_hours").eq("id", tenantId).maybeSingle();
  const hours = parseHours(hoursRow?.site_chat_hours);
  let aiAllowed = flags.ai && !humanMode && count <= SITE_CHAT_LIMITS.messagesPerConversation;
  // One credit per conversation, taken when the AI first answers it. The ref
  // keeps two racing first messages from charging twice; a failed answer is
  // refunded below, so the next message can try (and charge) again.
  let reservation: CreditReservation | null = null;
  let outOfCredits = false;
  if (aiAllowed && !conv.ai_answered) {
    if (!flags.root && (await siteChatToday(admin, tenantId)) >= SITE_CHAT_LIMITS.conversationsPerDay) aiAllowed = false;
    else {
      try {
        reservation = await reserveCredits(tenantId, "website_chat", { ref: conv.id as string });
      } catch (e) {
        aiAllowed = false;
        outOfCredits = e instanceof AiCreditsError && e.code === "no_credits";
        if (!outOfCredits) console.error("[site-chat] credit check failed", tenantId, e instanceof Error ? e.message : e);
      }
    }
  }
  if (aiAllowed && ip !== "unknown") {
    const { data: todays } = await admin.from("site_chat_conversations").select("message_count").eq("tenant_id", tenantId).eq("ip", ip).gte("started_at", dayAgo);
    if ((todays ?? []).reduce((n, c) => n + Number(c.message_count), 0) > AI_MESSAGES_PER_VISITOR_DAY) aiAllowed = false;
  }
  if (!aiAllowed) {
    const askedNow = wantsHuman && !conv.human_requested_at;
    if (askedNow) after(() => alertHumanWanted(tenantId, conv!.id as string, message));
    return NextResponse.json({
      mode: "live", message: vm ? pub(vm) : null, replyMinutes: flags.replyMinutes, handoff: handoffOf(contact, message),
      // Out of credits, or a job chat that ran out of messages before the visitor left their details.
      ...((outOfCredits || (flags.intake && !humanMode && count > SITE_CHAT_LIMITS.messagesPerConversation)) && !conv.lead_contact_id ? { askContact: true } : {}),
      ...(flags.ai && !humanMode && count > SITE_CHAT_LIMITS.messagesPerConversation ? { reply: "For more help, our team will reply here shortly, or you can message us on WhatsApp." }
        : askedNow && !humanMode ? { reply: humanWaitReply(hours) } : {}),
    });
  }

  // AI answer, streamed as SSE.
  const { data: past } = await admin.from("site_chat_messages").select("role, body, meta").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(24);
  const turns = (past ?? []).reverse().filter((m) => m.role !== "system");
  // The model is told a photo arrived but does not read it: no extra cost, nothing for a picture to inject.
  const history = turns.map((m) => ({ role: m.role === "visitor" ? "user" : "assistant", content: m.role === "agent" ? `[Team member] ${m.body}` : (m.meta as MessageMeta | null)?.photos?.length ? "[The visitor sent a photo. You cannot see it; the team can.]" : String(m.body) }));
  const transcriptText = () => turns.map((m) => `${m.role === "visitor" ? "Visitor" : m.role === "agent" ? "Team" : "Assistant"}: ${m.body}`).join("\n");
  const convId = conv.id as string;
  const namePrompt = conv.visitor_name ? `The visitor's name is ${conv.visitor_name}.` : VISITOR_NAME_PROMPT;
  const prev = { input: Number(conv.input_tokens), output: Number(conv.output_tokens), cached: Number(conv.cached_tokens), cost: Number(conv.cost_usd), human: conv.human_requested_at };

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: unknown) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      send({ t: "visitor", message: vm ? pub(vm) : null });
      try {
        const [knowledge, { data: files }] = await Promise.all([
          getSiteChatKnowledge(tenantId),
          admin.from("site_chat_training").select("title, content, kind").eq("tenant_id", tenantId).eq("kind", "file").limit(60),
        ]);
        // Train AI files: only the parts matching what the visitor is asking about.
        const recent = turns.filter((m) => m.role === "visitor").slice(-2).map((m) => String(m.body)).join(" ");
        const fileCtx = fileContext(fileChunks((files ?? []) as TrainingRow[]), recent);
        // Sites that opted into job intake: site visit and lead tools fixed to this site and this chat.
        const intake = flags.intake ? await createIntakeRun({
          admin, tenantId, conversationId: convId, sessionId, ip, siteName: knowledge.siteName || siteName, word: flags.intake.word, lang: intakeLang(chatLang, message),
          businessWhatsapp: contact.whatsapp, existing: conv.intake ?? null, transcript: transcriptText,
          visitorCountry: req.headers.get("x-vercel-ip-country"),
        }) : null;
        const context = [fileCtx, intake?.context(SITE_CHAT_LIMITS.messagesPerConversation - count)].filter(Boolean).join("\n\n");
        // One retry when the model call fails before any text reached the visitor (OpenRouter blips).
        let streamed = false;
        const turn = () => runAiTurn({ admin, tenantId, siteName, conversationId: convId, sessionId, system: `${knowledge.prompt}\n\n${humanHandoffPrompt(hours)}\n\n${namePrompt}
${intake ? intakePrompt(intake.word) : conv.lead_contact_id ? "" : LEAD_CAPTURE_PROMPT}${langPrompt(chatLang, !!picked)}`, context, history, transcriptText, intake, onDelta: (v) => { streamed = true; send({ t: "delta", v }); } });
        let r;
        try { r = await turn(); if (!r.text) throw new Error("empty"); } catch (e) {
          console.error("[site-chat] AI turn failed", tenantId, e instanceof Error ? e.message : e);
          if (streamed) throw e;
          r = await turn();
        }
        if (!r.text) throw new Error("empty");
        // The visitor's card goes on the message that saved the request, once.
        const savedNow = !conv.intake && !!r.visit;
        const { data: am } = await admin.from("site_chat_messages").insert({ tenant_id: tenantId, conversation_id: convId, role: "ai", body: r.text.slice(0, 4000), ...(savedNow && r.visit ? { meta: { visit: r.visit } satisfies MessageMeta } : {}) }).select("id, role, body, author_name, created_at, meta").single();
        const human = r.humanRequested || wantsHuman;
        await admin.from("site_chat_conversations").update({
          ai_answered: true, last_at: new Date().toISOString(), last_message: r.text.slice(0, 200),
          input_tokens: prev.input + r.usage.prompt, output_tokens: prev.output + r.usage.completion,
          cached_tokens: prev.cached + r.usage.cached, cost_usd: prev.cost + r.usage.cost,
          ...(human && !prev.human ? { human_requested_at: new Date().toISOString() } : {}),
        }).eq("id", convId);
        if (human && !prev.human) {
          await alertHumanWanted(tenantId, convId, message).catch(() => undefined);
        }
        send({ t: "done", message: am ? pub(am) : null, lead: intake ? savedNow : !!r.leadId, human, handoff: human ? handoffOf(contact, message) : null, messagesLeft: SITE_CHAT_LIMITS.messagesPerConversation - count });
      } catch (e) {
        console.error("[site-chat] AI answer failed", tenantId, e instanceof Error ? e.message : e);
        if (reservation) await refundCredits(reservation).catch(() => undefined);
        send({ t: "error", reply: "Sorry, I could not answer that right now. Our team will reply here, or message us on WhatsApp.", handoff: handoffOf(contact, message) });
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
}
