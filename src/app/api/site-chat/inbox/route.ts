import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveInboxCaller, type InboxCaller as Caller } from "@/lib/site-chat/inbox-caller";
import { banSender } from "@/lib/spam/ban";

/**
 * Owner/staff inbox for the site chat (web dashboard now, mobile admin app
 * later: cookie or Bearer auth via getApiCaller).
 *
 *   GET                 -> conversations (latest first, unread counts)
 *   GET ?id=<conv>      -> one conversation + all messages
 *   GET ?online=1       -> visitors seen in the last 60s (Online now)
 *   GET ?visitor=<sid>  -> one visitor session + pages
 *   POST { id, action: "reply", body } | "takeover" | "handback" | "read" | "close" | "reopen" | "rename" (name) | "ban" (ban_ip, ip_days, scope, reason)
 *   POST { action: "start", session, body } -> staff opens a chat with an online visitor
 *
 * A reply or "takeover" pauses the AI for that conversation; "handback" resumes it.
 *
 * ?root=1: the platform's own site's chat, for super admins and active staff
 * (Staff portal > Site Chat, Super Admin > Site Chat), so a visitor still
 * reaches a human when the owner is away. They are not members of the root
 * tenant, so it is resolved here instead of from the caller's site.
 */
const CONV_COLS = "id, session_id, started_at, last_at, message_count, status, ai_answered, ai_paused, agent_user_id, agent_name, human_requested_at, unread_owner, last_message, visitor_page, visitor_country, visitor_lang, visitor_name, lead_contact_id, cost_usd, intake";

const VISITOR_COLS = "session_id, first_seen, started_at, last_seen, visits_count, country, referrer, current_path, current_title, pages_count, seconds, conversation_id";
type Admin = Awaited<ReturnType<typeof createAdminClient>>;

async function visitorOf(admin: Admin, tenantId: string, sessionId: string) {
  const [{ data: visitor }, { data: pages }] = await Promise.all([
    admin.from("site_visitors").select(VISITOR_COLS).eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle(),
    admin.from("site_visitor_pages").select("path, title, entered_at, seconds").eq("tenant_id", tenantId).eq("session_id", sessionId).order("entered_at").limit(100),
  ]);
  return visitor ? { ...visitor, pages: pages ?? [] } : null;
}

export async function GET(req: NextRequest) {
  const caller = await resolveInboxCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const sp = req.nextUrl.searchParams;
  if (sp.get("online") === "1") {
    const { data } = await admin.from("site_visitors").select(VISITOR_COLS).eq("tenant_id", caller.tenantId)
      .gt("last_seen", new Date(Date.now() - 60_000).toISOString()).order("started_at", { ascending: false }).limit(100);
    return NextResponse.json({ visitors: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  }
  const sid = sp.get("visitor");
  if (sid) return NextResponse.json({ visitor: await visitorOf(admin, caller.tenantId, sid.slice(0, 64)) }, { headers: { "Cache-Control": "no-store" } });
  const id = sp.get("id");
  if (id) {
    const [{ data: conv }, { data: messages }] = await Promise.all([
      admin.from("site_chat_conversations").select(CONV_COLS).eq("tenant_id", caller.tenantId).eq("id", id).maybeSingle(),
      admin.from("site_chat_messages").select("id, role, body, author_name, author_user_id, created_at, meta").eq("tenant_id", caller.tenantId).eq("conversation_id", id).order("created_at").limit(500),
    ]);
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const visitor = conv.session_id ? await visitorOf(admin, caller.tenantId, conv.session_id as string) : null;
    return NextResponse.json({ conversation: conv, messages: messages ?? [], visitor });
  }
  // Waiting = asked for a person, no one has joined yet (sidebar red badge).
  const waitingQ = () => admin.from("site_chat_conversations").select("id", { count: "exact", head: true }).eq("tenant_id", caller.tenantId)
    .eq("status", "open").not("human_requested_at", "is", null).is("agent_user_id", null).is("blocked_at", null);
  if (req.nextUrl.searchParams.get("count") === "1") {
    const { count } = await waitingQ();
    return NextResponse.json({ waiting: count ?? 0 }, { headers: { "Cache-Control": "no-store" } });
  }
  const [{ data }, { count: waiting }] = await Promise.all([
    admin.from("site_chat_conversations").select(CONV_COLS).eq("tenant_id", caller.tenantId).is("blocked_at", null).order("last_at", { ascending: false }).limit(100),
    waitingQ(),
  ]);
  // Presence: heartbeat last_seen + current page per conversation's session.
  const sids = (data ?? []).map((c) => c.session_id as string).filter(Boolean);
  const { data: seen } = sids.length ? await admin.from("site_visitors").select("session_id, last_seen, current_path").eq("tenant_id", caller.tenantId).in("session_id", sids) : { data: [] };
  const bySid = new Map((seen ?? []).map((v) => [v.session_id as string, v]));
  const list = (data ?? []).map((c) => ({ ...c, last_seen: bySid.get(c.session_id as string)?.last_seen ?? null, current_path: bySid.get(c.session_id as string)?.current_path ?? null }));
  return NextResponse.json({ tenantId: caller.tenantId, conversations: list, waiting: waiting ?? 0, unread: list.reduce((s, c) => s + Number(c.unread_owner ?? 0), 0) });
}

async function agentName(admin: Admin, userId: string, email?: string | null) {
  const { data } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return ((data?.full_name as string | null)?.trim().split(/\s+/)[0]) || (email ? email.split("@")[0] : "Team");
}

export async function POST(req: NextRequest) {
  const caller = await resolveInboxCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tenantId = caller.tenantId;
  const b = (await req.json().catch(() => ({}))) as { id?: string; action?: string; body?: string; session?: string; name?: string; ban_ip?: boolean; ip_days?: number; scope?: string; reason?: string };
  if (b.action === "start") return startChat(caller, b.session, b.body);
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const admin = await createAdminClient();
  const { data: conv } = await admin.from("site_chat_conversations").select("id, agent_user_id, agent_name").eq("tenant_id", tenantId).eq("id", b.id).maybeSingle();
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date().toISOString();
  const sys = (body: string) => admin.from("site_chat_messages").insert({ tenant_id: tenantId, conversation_id: conv.id, role: "system", body });

  const join = async () => {
    if (conv.agent_user_id === caller.userId) return conv.agent_name as string;
    const name = await agentName(admin, caller.userId, caller.user?.email);
    await admin.from("site_chat_conversations").update({ agent_user_id: caller.userId, agent_name: name, ai_paused: true, unread_owner: 0 }).eq("id", conv.id);
    await sys(`${name} joined the chat`);
    return name;
  };

  switch (b.action) {
    case "reply": {
      const text = String(b.body ?? "").trim().slice(0, 4000);
      if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
      const name = await join();
      const { data: m, error } = await admin.from("site_chat_messages").insert({
        tenant_id: tenantId, conversation_id: conv.id, role: "agent", body: text, author_user_id: caller.userId, author_name: name,
      }).select("id, role, body, author_name, author_user_id, created_at").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await admin.from("site_chat_conversations").update({ last_at: now, last_message: text.slice(0, 200), unread_owner: 0, status: "open" }).eq("id", conv.id);
      return NextResponse.json({ ok: true, message: m });
    }
    case "takeover":
      await join();
      return NextResponse.json({ ok: true });
    case "handback":
      await admin.from("site_chat_conversations").update({ agent_user_id: null, agent_name: null, ai_paused: false, human_requested_at: null }).eq("id", conv.id);
      await sys("You are chatting with our AI assistant again");
      return NextResponse.json({ ok: true });
    case "rename": {
      const name = String(b.name ?? "").trim().slice(0, 120) || null;
      await admin.from("site_chat_conversations").update({ visitor_name: name }).eq("id", conv.id);
      return NextResponse.json({ ok: true });
    }
    case "ban": {
      const { data: staff } = await admin.from("pc_staff").select("status").eq("user_id", caller.userId).maybeSingle();
      const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", caller.userId).maybeSingle();
      const r = await banSender(admin, {
        tenantId, userId: caller.userId, platform: !!sa || staff?.status === "active", from: { type: "chat", id: conv.id as string },
        banIp: b.ban_ip === true, ipDays: typeof b.ip_days === "number" ? b.ip_days : undefined, scope: b.scope === "all" ? "all" : "site", reason: b.reason ?? null,
      });
      return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 400 });
    }
    case "read":
      await admin.from("site_chat_conversations").update({ unread_owner: 0 }).eq("id", conv.id);
      return NextResponse.json({ ok: true });
    case "close":
    case "reopen":
      await admin.from("site_chat_conversations").update({ status: b.action === "close" ? "closed" : "open", unread_owner: 0 }).eq("id", conv.id);
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

/** Proactive chat: the team writes first to a visitor who is browsing now. The widget finds it on its next heartbeat and opens. */
async function startChat(caller: Caller, session?: string, body?: string) {
  const tenantId = caller.tenantId;
  const sessionId = String(session ?? "").slice(0, 64);
  const text = String(body ?? "").trim().slice(0, 4000);
  if (!sessionId || !text) return NextResponse.json({ error: "Visitor and message required" }, { status: 400 });
  const admin = await createAdminClient();
  const { data: v } = await admin.from("site_visitors").select("country, current_path").eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle();
  if (!v) return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
  const name = await agentName(admin, caller.userId, caller.user?.email);
  const now = new Date().toISOString();
  let { data: conv } = await admin.from("site_chat_conversations").select("id").eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle();
  if (!conv) {
    const ins = await admin.from("site_chat_conversations").insert({
      tenant_id: tenantId, session_id: sessionId, visitor_country: v.country, visitor_page: v.current_path,
      agent_user_id: caller.userId, agent_name: name, ai_paused: true, status: "open", unread_owner: 0,
    }).select("id").single();
    if (ins.error || !ins.data) return NextResponse.json({ error: ins.error?.message ?? "Could not start" }, { status: 500 });
    conv = ins.data;
    await admin.from("site_chat_messages").insert({ tenant_id: tenantId, conversation_id: conv.id, role: "system", body: `${name} joined the chat` });
  } else {
    await admin.from("site_chat_conversations").update({ agent_user_id: caller.userId, agent_name: name, ai_paused: true }).eq("id", conv.id);
  }
  await admin.from("site_chat_messages").insert({ tenant_id: tenantId, conversation_id: conv.id, role: "agent", body: text, author_user_id: caller.userId, author_name: name });
  await Promise.all([
    admin.from("site_chat_conversations").update({ last_at: now, last_message: text.slice(0, 200), status: "open" }).eq("id", conv.id),
    admin.from("site_visitors").update({ conversation_id: conv.id }).eq("tenant_id", tenantId).eq("session_id", sessionId),
  ]);
  return NextResponse.json({ ok: true, id: conv.id });
}
