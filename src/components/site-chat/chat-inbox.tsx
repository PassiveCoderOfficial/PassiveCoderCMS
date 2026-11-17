"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, Bot, User, Send, Loader2, ArrowLeft, Hand, Undo2, Settings2, CheckCheck, Bell, BellOff, Pencil, Check, X, Radio, Globe, Clock, FileText, Eye, GraduationCap, Ban } from "lucide-react";
import { BanDialog } from "@/components/spam/ban-dialog";
import { TrainPanel } from "./train-panel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/language-provider";
import { AiCreditsBar } from "@/components/agent/ai-credits-bar";
import type { CreditStatus } from "@/lib/ai/credit-costs";
import { cn } from "@/lib/utils";
import { DateTimeField } from "@/components/ui/date-time-field";
import { fmtDate } from "@/lib/time/panel-tz";
import { usePanelTimeZone } from "@/components/providers/panel-time-zone";

type Conv = {
  id: string; started_at: string; last_at: string; message_count: number; status: "open" | "closed";
  ai_answered: boolean; ai_paused: boolean; agent_user_id: string | null; agent_name: string | null; human_requested_at: string | null;
  unread_owner: number; last_message: string | null; visitor_page: string | null; visitor_country: string | null; visitor_lang: string | null;
  visitor_name: string | null; lead_contact_id: string | null; cost_usd: number; session_id: string | null;
  intake: JobRecord | null;
  last_seen: string | null; current_path: string | null; // visitor heartbeat
};
type VisitorPage = { path: string; title: string | null; entered_at: string; seconds: number };
type Visitor = {
  session_id: string; first_seen: string; started_at: string; last_seen: string; visits_count: number; country: string | null; referrer: string | null;
  current_path: string | null; current_title: string | null; pages_count: number; seconds: number; conversation_id: string | null; pages?: VisitorPage[];
};
type Msg = { id: string; role: "visitor" | "ai" | "agent" | "system"; body: string; author_name: string | null; created_at: string; meta?: { photos?: { url: string }[] } | null };
/** What the AI collected in this chat (site_chat_conversations.intake). */
type JobRecord = {
  kind: "visit" | "lead"; word: string; when: string | null; status: "pending" | "confirmed" | null;
  contact: { name: string; phone: string; email: string };
  job: { work_type: string; property_type: string; location: string; budget: string; details: string; summary_en: string };
  appointment_id: string | null; owner_whatsapp: string | null; forward_whatsapp: string;
};
type Hours = { days: number[]; start: string; end: string; tz: string };
type IntakeSettings = { enabled: boolean; word: string; bookingOn: boolean; autoConfirm: boolean; hasWhatsapp: boolean };
type Settings = {
  hours: Hours | null;
  widget: boolean; aiEnabled: boolean; planAllowed: boolean; greeting: string; replyMinutes: number; defaultGreeting: string;
  prompt?: ChatPromptSetting;
  credits: CreditStatus | null;
  intake?: IntakeSettings;
};

/** "just now", "5m ago", "3h 10m ago" within a day; after that the exact date and clock time (no "ago"). */
const ago = (iso: string, tz?: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}h${m ? ` ${m}m` : ""} ago`; }
  return new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", ...(tz ? { timeZone: tz } : {}) });
};
const dur = (sec: number) => { const s = Math.max(0, Math.round(sec)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`; };
const isOnline = (v: Visitor) => Date.now() - new Date(v.last_seen).getTime() < 60_000;
/** Is the visitor still on the site? From heartbeat last_seen: on (<60s), maybe (<5m), left. */
const presenceOf = (c: Conv) => {
  const ms = c.last_seen ? Date.now() - new Date(c.last_seen).getTime() : Infinity;
  return ms < 60_000 ? "on" : ms < 5 * 60_000 ? "maybe" : "left";
};
function Presence({ c }: { c: Conv }) {
  const tz = usePanelTimeZone();
  if (!c.last_seen) return null;
  const p = presenceOf(c);
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] min-w-0", p === "on" ? "text-green-700 dark:text-green-400" : p === "maybe" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", p === "on" ? "bg-green-500" : p === "maybe" ? "bg-amber-500" : "bg-muted-foreground/50")} />
      <span className="truncate">{p === "on" ? `On site now${c.current_path ? ` · ${pathLabel(c.current_path)}` : ""}` : `${p === "maybe" ? "Might have left" : "Left the site"} · ${ago(c.last_seen, tz)}`}</span>
    </span>
  );
}
/** Page path as staff read it: the homepage shows as /home, not a bare slash. */
const pathLabel = (p: string | null | undefined) => (!p || p === "/" ? "/home" : p);
/** Clock time; messages from before today also get the date. */
const clock = (iso: string, tz?: string) => {
  const d = new Date(iso);
  const zone = tz ? { timeZone: tz } : {};
  const dayOf = (x: Date) => x.toLocaleDateString("en-US", zone);
  return dayOf(d) === dayOf(new Date())
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...zone })
    : d.toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", ...zone });
};

function beep() {
  try {
    const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 880; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.15);
  } catch { /* no audio */ }
}
/** Two-tone alert: a visitor is waiting for a person. */
function alarm() {
  try {
    const ctx = new AudioContext();
    [0, 0.22, 0.44].forEach((at, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = i % 2 ? 660 : 990; g.gain.value = 0.07; o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + 0.18);
    });
  } catch { /* no audio */ }
}
const waitingFor = (c: Conv) => !!c.human_requested_at && !c.agent_user_id && c.status === "open";

/**
 * Site chat inbox. `root`: the platform's own site's chats, opened from the
 * staff portal and Super Admin (they are not members of the root tenant, so
 * the inbox API resolves it for them; settings stay in the root dashboard).
 */
export function ChatInbox({ root = false }: { root?: boolean }) {
  const tz = usePanelTimeZone();
  const inboxUrl = root ? "/api/site-chat/inbox?root=1" : "/api/site-chat/inbox";
  const [banning, setBanning] = useState(false);
  const t = useT();
  const [tab, setTab] = useState<"inbox" | "train" | "settings">("inbox");
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sound, setSound] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [online, setOnline] = useState<Visitor[]>([]);
  const [visitor, setVisitor] = useState<Visitor | null>(null); // stats for the open conversation or picked visitor
  const [pickedSid, setPickedSid] = useState<string | null>(null); // online visitor opened without a conversation
  const [startText, setStartText] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const pickedRef = useRef<string | null>(null);
  pickedRef.current = pickedSid;
  const listEnd = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const waitingRef = useRef(Number.POSITIVE_INFINITY); // no alarm for chats already waiting on first load

  const loadList = useCallback(async () => {
    const r = await fetch(inboxUrl, { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    setConvs(j.conversations ?? []);
    setTenantId(j.tenantId ?? null);
    const w = Number(j.waiting ?? 0);
    if (w > waitingRef.current && soundRef.current) alarm();
    waitingRef.current = w;
  }, [inboxUrl]);
  const loadConv = useCallback(async (id: string) => {
    const r = await fetch(`${inboxUrl}${root ? "&" : "?"}id=${id}`, { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    if (activeRef.current === id) { setMsgs(j.messages ?? []); setVisitor(j.visitor ?? null); }
  }, [inboxUrl, root]);
  const q = root ? "&" : "?";
  const loadOnline = useCallback(async () => {
    const r = await fetch(`${inboxUrl}${q}online=1`, { cache: "no-store" });
    if (r.ok) setOnline((await r.json()).visitors ?? []);
  }, [inboxUrl, q]);
  const loadVisitor = useCallback(async (sid: string) => {
    const r = await fetch(`${inboxUrl}${q}visitor=${encodeURIComponent(sid)}`, { cache: "no-store" });
    if (r.ok && pickedRef.current === sid) setVisitor((await r.json()).visitor ?? null);
  }, [inboxUrl, q]);

  // Online now: poll every 10s (heartbeats are not realtime-published).
  useEffect(() => {
    loadOnline();
    const t = setInterval(() => { loadOnline(); if (pickedRef.current) loadVisitor(pickedRef.current); }, 10_000);
    return () => clearInterval(t);
  }, [loadOnline, loadVisitor]);
  const loadSettings = useCallback(async () => {
    if (root) return;
    const r = await fetch("/api/site-chat/admin", { cache: "no-store" });
    if (r.ok) setSettings(await r.json());
  }, [root]);

  useEffect(() => { loadList(); loadSettings(); }, [loadList, loadSettings]);
  // A link from Bookings or an alert email opens that chat (?c=<conversation>).
  const linked = useRef(false);
  useEffect(() => {
    if (linked.current || !convs) return;
    linked.current = true;
    const c = new URLSearchParams(window.location.search).get("c");
    if (c && convs.some((x) => x.id === c)) open(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convs]);

  // Realtime (RLS: tenant members only), with polling as a fallback.
  useEffect(() => {
    if (!tenantId) return;
    const sb = createClient();
    const ch = sb.channel(`site-chat-${tenantId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "site_chat_messages", filter: `tenant_id=eq.${tenantId}` }, (p) => {
        const m = p.new as Msg & { conversation_id: string };
        if (m.conversation_id === activeRef.current) setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (m.role === "visitor" && soundRef.current) beep();
        loadList();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "site_chat_conversations", filter: `tenant_id=eq.${tenantId}` }, () => loadList())
      .subscribe();
    const poll = setInterval(() => { loadList(); if (activeRef.current) loadConv(activeRef.current); }, 10_000);
    return () => { sb.removeChannel(ch); clearInterval(poll); };
  }, [tenantId, loadList, loadConv]);

  useEffect(() => { listEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, activeId]);

  const open = async (id: string) => {
    setActiveId(id); setMsgs([]); setVisitor(null); setPickedSid(null); setRenaming(null); loadConv(id);
    await fetch(inboxUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "read" }) });
    loadList();
  };
  const act = async (action: string, body?: string, extra?: Record<string, string>) => {
    if (!activeId) return null;
    const r = await fetch(inboxUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: activeId, action, body, ...extra }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error(j.error ?? t("chat.failed")); return null; }
    loadConv(activeId); loadList();
    return j;
  };
  const pickVisitor = (v: Visitor) => {
    setActiveId(null); setPickedSid(v.session_id); setVisitor(v); setStartText(""); loadVisitor(v.session_id);
  };
  const startChat = async () => {
    const text = startText.trim();
    if (!pickedSid || !text) return;
    setSending(true);
    const r = await fetch(inboxUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", session: pickedSid, body: text }) });
    const j = await r.json().catch(() => ({}));
    setSending(false);
    if (!r.ok) { toast.error(j.error ?? t("chat.failed")); return; }
    setStartText(""); await loadList(); loadOnline(); open(j.id);
  };
  const send = async () => {
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    const j = await act("reply", text);
    setSending(false);
    if (j) setReply("");
  };

  const sorted = useMemo(() => [...(convs ?? [])].sort((a, b) => {
    const pa = (waitingFor(a) ? 4 : 0) + (a.unread_owner > 0 ? 2 : 0) + (presenceOf(a) !== "left" ? 1 : 0);
    const pb = (waitingFor(b) ? 4 : 0) + (b.unread_owner > 0 ? 2 : 0) + (presenceOf(b) !== "left" ? 1 : 0);
    return pb - pa || b.last_at.localeCompare(a.last_at);
  }), [convs]);
  const active = convs?.find((c) => c.id === activeId) ?? null;

  const saveSettings = async (patch: SettingsPatch) => {
    const r = await fetch("/api/site-chat/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (r.ok) { toast.success(t("chat.saved")); loadSettings(); } else toast.error(t("chat.failed"));
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h1 className="text-xl md:text-2xl font-bold">{t("chat.title")}</h1>
          {settings && <span className={cn("text-xs rounded-full px-2 py-0.5", settings.widget || settings.aiEnabled ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground")}>{settings.widget || settings.aiEnabled ? t("chat.live") : t("chat.off")}</span>}
        </div>
        {!root && <div className="flex gap-2">
          <Button size="sm" variant={tab === "inbox" ? "default" : "outline"} onClick={() => setTab("inbox")}><MessageSquare className="w-4 h-4 mr-1" />{t("chat.inbox")}</Button>
          <Button size="sm" variant={tab === "train" ? "default" : "outline"} onClick={() => setTab("train")}><GraduationCap className="w-4 h-4 mr-1" />{t("chat.train")}</Button>
          <Button size="sm" variant={tab === "settings" ? "default" : "outline"} onClick={() => setTab("settings")}><Settings2 className="w-4 h-4 mr-1" />{t("chat.settings")}</Button>
        </div>}
      </div>

      {tab === "train" ? (
        <TrainPanel />
      ) : tab === "settings" ? (
        <SettingsPanel s={settings} save={saveSettings} />
      ) : (
        <div className="grid md:grid-cols-[300px_1fr] lg:grid-cols-[210px_300px_1fr] gap-4 min-h-[70vh]">
          {/* Online now + conversations: stacked below lg, two columns on lg (hidden on phones while a pane is open) */}
          <div className={cn("space-y-4 lg:space-y-0 lg:contents", (activeId || pickedSid) && "hidden md:block lg:contents")}>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b text-xs text-muted-foreground">
              <Radio className={cn("w-3.5 h-3.5", online.length > 0 && "text-green-500")} />
              <span>Online now ({online.length})</span>
            </div>
            <div className="max-h-48 lg:max-h-[70vh] overflow-y-auto divide-y">
              {online.length === 0 && <p className="p-3 text-xs text-muted-foreground">No visitors on the site right now.</p>}
              {online.map((v) => {
                const conv = convs?.find((c) => c.id === v.conversation_id || c.session_id === v.session_id);
                const sel = v.session_id === pickedSid || (!!conv && conv.id === activeId);
                return (
                  <button key={v.session_id} type="button" onClick={() => (conv ? open(conv.id) : pickVisitor(v))}
                    className={cn("w-full text-left px-3 py-2 hover:bg-muted/60 text-xs space-y-0.5", sel && "bg-muted")}>
                    <span className="flex items-center gap-1.5 font-medium text-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="truncate">{conv?.visitor_name ?? v.country ?? t("chat.visitor")}</span>
                      {conv && <MessageSquare className="w-3 h-3 text-primary shrink-0 ml-auto" />}
                    </span>
                    <span className="block text-muted-foreground">{[conv?.visitor_name ? v.country : null, dur(v.seconds), `${v.pages_count} ${v.pages_count === 1 ? "page" : "pages"}`, v.visits_count > 1 ? `visit ${v.visits_count}` : "new"].filter(Boolean).join(" · ")}</span>
                    <span className="block truncate text-muted-foreground" title={v.current_path ?? ""}>{pathLabel(v.current_path)}</span>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b text-xs text-muted-foreground">
              <span>{t("chat.conversations")} {convs ? `(${convs.length})` : ""}</span>
              <button type="button" onClick={() => setSound((v) => !v)} className="p-1 rounded hover:bg-muted" aria-label={t("chat.sound")} title={t("chat.sound")}>
                {sound ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y">
              {convs === null && <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}
              {convs?.length === 0 && <p className="p-6 text-sm text-muted-foreground">{t("chat.empty")}</p>}
              {sorted.map((c) => (
                <button key={c.id} type="button" onClick={() => open(c.id)}
                  className={cn("w-full text-left px-3 py-3 hover:bg-muted/60 flex gap-3 border-l-4 border-transparent", c.id === activeId && "bg-muted",
                    waitingFor(c) && "border-red-500 bg-red-500/10 hover:bg-red-500/15")}>
                  <span className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm", waitingFor(c) ? "bg-red-500 text-white" : "bg-primary/10 text-primary")}>
                    {(c.visitor_name ?? "V").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", c.unread_owner > 0 && "font-semibold")}>{c.visitor_name ?? `${t("chat.visitor")}${c.visitor_country ? ` · ${c.visitor_country}` : ""}`}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{ago(c.last_at, tz)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 mt-0.5">
                      {c.agent_user_id ? <User className="w-3 h-3 text-blue-500 shrink-0" /> : c.ai_answered && !c.ai_paused ? <Bot className="w-3 h-3 text-violet-500 shrink-0" /> : null}
                      <span className="truncate text-xs text-muted-foreground">{c.last_message ?? ""}</span>
                      {c.unread_owner > 0 && <span className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center">{c.unread_owner}</span>}
                    </span>
                    {c.last_seen && <span className="flex mt-0.5"><Presence c={c} /></span>}
                    {waitingFor(c) && <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"><Hand className="w-3 h-3" />{t("chat.wantsHuman")} · {ago(c.human_requested_at!, tz)}</span>}
                  </span>
                </button>
              ))}
            </div>
          </Card>
          </div>

          {/* Conversation, or a picked online visitor */}
          <Card className={cn("flex flex-col overflow-hidden", !activeId && !pickedSid && "hidden md:flex")}>
            {!active && pickedSid ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 border-b">
                  <button type="button" className="md:hidden p-1" onClick={() => setPickedSid(null)} aria-label={t("chat.back")}><ArrowLeft className="w-5 h-5" /></button>
                  <div className="flex-1 min-w-0 font-semibold text-sm">{t("chat.visitor")}{visitor?.country ? ` · ${visitor.country}` : ""}</div>
                  {visitor && <span className={cn("text-[11px] rounded-full px-2 py-0.5", isOnline(visitor) ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground")}>{isOnline(visitor) ? "Online" : "Left the site"}</span>}
                </div>
                {visitor ? <VisitorStats v={visitor} open /> : <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}
                <div className="flex-1" />
                <form className="flex flex-col gap-2 p-3 border-t" onSubmit={(e) => { e.preventDefault(); startChat(); }}>
                  <span className="text-xs text-muted-foreground">Start a chat: your message pops up on the visitor&apos;s screen. The AI stays paused while you talk.</span>
                  <div className="flex gap-2">
                    <Input value={startText} onChange={(e) => setStartText(e.target.value)} placeholder="Hi! Can I help you find anything?" maxLength={4000} />
                    <Button type="submit" disabled={sending || !startText.trim()}>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" />Start chat</>}</Button>
                  </div>
                </form>
              </>
            ) : !active ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-10">{t("chat.pick")}</div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2 border-b flex-wrap">
                  <button type="button" className="md:hidden p-1" onClick={() => setActiveId(null)} aria-label={t("chat.back")}><ArrowLeft className="w-5 h-5" /></button>
                  <div className="flex-1 min-w-0">
                    {renaming !== null ? (
                      <form className="flex items-center gap-1" onSubmit={async (e) => { e.preventDefault(); await act("rename", undefined, { name: renaming }); setRenaming(null); }}>
                        <Input value={renaming} onChange={(e) => setRenaming(e.target.value)} maxLength={120} autoFocus className="h-7 text-sm" placeholder="Visitor name" />
                        <button type="submit" className="p-1 rounded hover:bg-muted" aria-label="Save name"><Check className="w-4 h-4" /></button>
                        <button type="button" className="p-1 rounded hover:bg-muted" onClick={() => setRenaming(null)} aria-label="Cancel"><X className="w-4 h-4" /></button>
                      </form>
                    ) : (
                      <div className="font-semibold text-sm flex items-center gap-1 min-w-0">
                        <span className="truncate">{active.visitor_name ?? t("chat.visitor")}</span>
                        <button type="button" className="p-0.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground shrink-0" onClick={() => setRenaming(active.visitor_name ?? "")} aria-label="Edit name" title="Edit name"><Pencil className="w-3 h-3" /></button>
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground truncate">
                      {[active.visitor_country, active.visitor_lang, active.visitor_page && pathLabel(active.visitor_page)].filter(Boolean).join(" · ")}
                      {active.lead_contact_id && !root && <> · <Link href={`/dashboard/crm?contact=${active.lead_contact_id}`} className="text-primary hover:underline">{t("chat.lead")}</Link></>}
                    </div>
                  </div>
                  <Presence c={active} />
                  {(active.agent_user_id || active.ai_paused) && (
                    <Button size="sm" variant="outline" onClick={() => act("handback")}><Undo2 className="w-4 h-4 mr-1" />{t("chat.handBack")}</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => act(active.status === "open" ? "close" : "reopen")}>
                    <CheckCheck className="w-4 h-4 mr-1" />{active.status === "open" ? t("chat.close") : t("chat.reopen")}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400" onClick={() => setBanning(true)}><Ban className="w-4 h-4 mr-1" />{t("spam.ban")}</Button>
                  {banning && (
                    <BanDialog onClose={() => setBanning(false)} onSubmit={async (o) => {
                      const r = await fetch(inboxUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: activeId, action: "ban", ...o }) });
                      const j = await r.json().catch(() => ({}));
                      if (!r.ok) return j.error ?? t("spam.failed");
                      toast.success(j.ipSkipped ? t("spam.bannedIpSite") : t("spam.bannedDone"));
                      setActiveId(null);
                      loadList();
                      return null;
                    }} />
                  )}
                </div>
                {visitor && <VisitorStats v={visitor} />}
                {active.intake && <JobCard job={active.intake} contactId={root ? null : active.lead_contact_id} photos={msgs.flatMap((m) => m.meta?.photos ?? []).map((p) => p.url)} />}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30 max-h-[60vh] md:max-h-none">
                  {msgs.map((m) => m.role === "system" ? (
                    <div key={m.id} className="text-center text-[11px] text-muted-foreground py-1">{m.body}</div>
                  ) : (
                    <div key={m.id} className={cn("flex flex-col max-w-[80%]", m.role === "visitor" ? "items-start" : "items-end ml-auto")}>
                      <div className={cn("rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                        m.role === "visitor" ? "bg-background border rounded-bl-sm" : m.role === "ai" ? "bg-violet-500/10 border border-violet-500/20 rounded-br-sm" : "bg-primary text-primary-foreground rounded-br-sm")}>
                        {m.meta?.photos?.length
                          ? m.meta.photos.map((p) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt="From the visitor" className="max-h-56 rounded-lg" loading="lazy" /></a>
                          ))
                          : m.body}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                        {m.role === "ai" ? t("chat.ai") : m.role === "agent" ? (m.author_name ?? t("chat.team")) : t("chat.visitor")} · {clock(m.created_at, tz)}
                      </span>
                    </div>
                  ))}
                  <div ref={listEnd} />
                </div>
                {(active.agent_user_id || active.ai_paused) && (
                  <div className="flex items-center gap-2 px-3 py-2 border-t text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">{active.agent_name ? `${active.agent_name} is in this chat. ` : ""}AI paused. It resumes by itself 5 minutes after the last team reply.</span>
                    <button type="button" onClick={() => act("handback")} className="inline-flex items-center gap-1 font-semibold hover:underline"><Bot className="w-3.5 h-3.5" />Resume AI now</button>
                  </div>
                )}
                {waitingFor(active) && (
                  <div className="flex items-center gap-2 px-3 py-2 border-t text-xs bg-red-500/10 text-red-700 dark:text-red-300">
                    <Hand className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">This visitor asked for a person ({ago(active.human_requested_at!, tz)}). Take over to reply.</span>
                  </div>
                )}
                {/* While the AI is in charge, watch only: replying starts with an explicit take over. */}
                {!(active.agent_user_id || active.ai_paused) ? (
                  <div className="flex flex-col items-center gap-2 p-3 border-t text-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Bot className="w-4 h-4 text-violet-500 shrink-0" />The AI is answering this visitor. Take over to reply yourself; the AI pauses until you hand back or go quiet for 5 minutes.</span>
                    <Button size="sm" onClick={() => act("takeover")} className={cn(waitingFor(active) && "bg-red-600 hover:bg-red-700 text-white")}><Hand className="w-4 h-4 mr-1" />{t("chat.takeOver")}</Button>
                  </div>
                ) : (
                <form className="flex gap-2 p-3 border-t" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("chat.replyPh")} autoFocus maxLength={4000} />
                  <Button type="submit" disabled={sending || !reply.trim()} aria-label={t("chat.send")}>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
                </form>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/** The job the AI collected, with what the owner can do next. WhatsApp links open a message for a person to send. */
function JobCard({ job, contactId, photos }: { job: JobRecord; contactId: string | null; photos: string[] }) {
  const rows: [string, string][] = ([
    ["Name", job.contact.name], ["Phone", job.contact.phone], ["Email", job.contact.email], ["Work", job.job.work_type], ["Property", job.job.property_type],
    ["Location", job.job.location], ["Budget", job.job.budget], ["Details", job.job.details],
  ] as [string, string][]).filter(([, v]) => !!v);
  return (
    <div className="px-3 py-3 border-b text-sm bg-primary/5 space-y-2">
      <div className="font-semibold">
        {job.kind === "visit"
          ? <span className="capitalize">{job.word} {job.status === "confirmed" ? "confirmed" : "requested"}{job.when ? ": " + job.when : ""}</span>
          : <>Lead saved{job.when ? " (prefers " + job.when + ")" : ""}</>}
        {job.kind === "visit" && job.status !== "confirmed" && <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-400">Waiting for you to confirm</span>}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="break-words" dir="auto">{v}</dd></div>)}
        {photos.length > 0 && <div className="contents"><dt className="text-muted-foreground">Photos</dt><dd>{photos.length}, in the chat below</dd></div>}
      </dl>
      <div className="flex flex-wrap gap-2">
        {job.owner_whatsapp && <a href={job.owner_whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full bg-[#25D366] px-3 py-1 text-xs font-semibold text-white">Reply on WhatsApp</a>}
        <a href={job.forward_whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">Forward lead on WhatsApp</a>
        {job.appointment_id && <Link href="/dashboard/bookings" className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">Confirm or change</Link>}
        {contactId && <Link href={`/dashboard/crm?contact=${contactId}`} className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">Open lead</Link>}
      </div>
    </div>
  );
}

/** Visitor analytics for a chat: first visit or returning, time on site, pages with time per page. */
function VisitorStats({ v, open: startOpen = false }: { v: Visitor; open?: boolean }) {
  const tz = usePanelTimeZone();
  const [open, setOpen] = useState(startOpen);
  const chips: [React.ReactNode, string][] = [
    [<Globe key="g" className="w-3 h-3" />, v.country ?? "Unknown country"],
    [<Eye key="e" className="w-3 h-3" />, v.visits_count > 1 ? `Returning · visit ${v.visits_count} · first ${fmtDate(v.first_seen, tz)}` : "First visit"],
    [<Clock key="c" className="w-3 h-3" />, `${dur(v.seconds)} on site`],
    [<FileText key="f" className="w-3 h-3" />, `${v.pages_count} ${v.pages_count === 1 ? "page" : "pages"}`],
  ];
  if (v.referrer) chips.push([<ArrowLeft key="r" className="w-3 h-3" />, `From ${v.referrer}`]);
  return (
    <div className="px-3 py-2 border-b text-[11px] bg-muted/20 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map(([icon, label], i) => <span key={i} className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-muted-foreground">{icon}{label}</span>)}
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-primary hover:underline">{open ? "Hide pages" : "Pages"}</button>
      </div>
      {isOnline(v) && v.current_path && <div className="flex items-center gap-1 text-green-700 dark:text-green-400 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />Now on <span className="font-medium truncate">{pathLabel(v.current_path)}</span></div>}
      {open && (
        <ol className="max-h-40 overflow-y-auto space-y-0.5">
          {(v.pages ?? []).map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-14">{clock(p.entered_at, tz)}</span>
              <span className="truncate flex-1" title={p.title ?? p.path}>{pathLabel(p.path)}{p.title ? <span className="text-muted-foreground"> · {p.title}</span> : null}</span>
              <span className="text-muted-foreground shrink-0">{dur(p.seconds)}</span>
            </li>
          ))}
          {!v.pages?.length && <li className="text-muted-foreground">No pages recorded.</li>}
        </ol>
      )}
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Every IANA zone the browser knows, common ones first. */
const COMMON_TZ = ["Asia/Dhaka", "Asia/Riyadh", "Asia/Dubai", "Asia/Qatar", "Asia/Kuwait", "Asia/Bahrain", "Asia/Muscat", "Asia/Singapore", "Asia/Kolkata", "Asia/Karachi", "Asia/Kuala_Lumpur", "Europe/London", "America/New_York", "Australia/Sydney"];
const TIMEZONES: string[] = (() => {
  let all: string[] = [];
  try { all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? []; } catch { /* old browser */ }
  return [...COMMON_TZ, ...all.filter((z) => !COMMON_TZ.includes(z))];
})();
const DEFAULT_HOURS: Hours = { days: [6, 0, 1, 2, 3, 4], start: "10:00", end: "18:00", tz: "Asia/Dhaka" };

type ChatPromptSetting = { mode: "bubble" | "open" | "off"; text: string | null };
type SettingsPatch = Partial<{ widget: boolean; greeting: string; replyMinutes: number; hours: Hours | null; aiEnabled: boolean; intake: { enabled: boolean; word: string }; prompt: ChatPromptSetting }>;

/** Job intake switch. Off by default; this card says exactly what happens and who taps what. */
function IntakeCard({ s, save }: { s: IntakeSettings; save: (i: { enabled: boolean; word: string }) => void }) {
  const preset = (w: string) => w === "site visit" || w === "inspection";
  const [word, setWord] = useState(s.word);
  const [custom, setCustom] = useState(!preset(s.word));
  useEffect(() => { setWord(s.word); setCustom(!preset(s.word)); }, [s.word]);
  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2"><CardTitle className="text-base">Job details and {word || "site visit"}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">The AI asks about the work, property, location and budget, takes photos, offers your open times from Bookings and saves the request with a lead in your CRM. You get a push and an email with a WhatsApp link: you tap it, check the message and send it. The visitor gets a button to send you the same details on WhatsApp. Nothing is sent on WhatsApp automatically. Each chat still uses 1 AI credit.</p>
          <Switch checked={s.enabled} onCheckedChange={(enabled) => save({ enabled, word: word.trim() || "site visit" })} />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1"><span className="block text-xs text-muted-foreground">Call it</span>
            <select value={custom ? "custom" : word} onChange={(e) => { if (e.target.value === "custom") { setCustom(true); setWord(""); } else { setCustom(false); setWord(e.target.value); save({ enabled: s.enabled, word: e.target.value }); } }} className="h-9 w-40 rounded-md border bg-background px-2 text-sm">
              <option value="site visit">site visit</option>
              <option value="inspection">inspection</option>
              <option value="custom">my own word</option>
            </select>
          </label>
          {custom && (
            <>
              <label className="space-y-1"><span className="block text-xs text-muted-foreground">Your word</span><Input value={word} onChange={(e) => setWord(e.target.value)} maxLength={40} className="w-48" placeholder="appointment" /></label>
              <Button size="sm" disabled={word.trim().length < 2} onClick={() => save({ enabled: s.enabled, word: word.trim() })}>Save</Button>
            </>
          )}
        </div>
        {s.enabled && !s.bookingOn && <p className="text-amber-700 dark:text-amber-400">Bookings is off, so the AI collects the details and saves a lead without offering times.</p>}
        {s.enabled && !s.hasWhatsapp && <p className="text-amber-700 dark:text-amber-400">Add a WhatsApp number in Contact so visitors can send you the details on WhatsApp.</p>}
        {s.enabled && <p className="text-muted-foreground">{s.autoConfirm ? "Bookings confirms automatically, so the AI tells visitors their time is confirmed." : "Bookings is set to manual confirmation, so the AI says the time is requested until you confirm it."}</p>}
      </CardContent>
    </Card>
  );
}

/** Team hours: what the AI tells a visitor who asks for a person. */
function HoursCard({ hours, save }: { hours: Hours | null; save: (h: Hours | null) => void }) {
  const [on, setOn] = useState(!!hours);
  const [h, setH] = useState<Hours>(hours ?? DEFAULT_HOURS);
  useEffect(() => { setOn(!!hours); setH(hours ?? DEFAULT_HOURS); }, [hours]);
  const toggleDay = (d: number) => setH((p) => ({ ...p, days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d] }));
  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2"><CardTitle className="text-base">Team hours</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">When a visitor asks for a person, the AI says the team will join shortly inside these hours, and outside them that a reply may take longer and asks for their contact details.</p>
          <Switch checked={on} onCheckedChange={setOn} />
        </div>
        {on && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {[6, 0, 1, 2, 3, 4, 5].map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={cn("px-2.5 py-1 rounded-md border text-xs", h.days.includes(d) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{DAYS[d]}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1"><span className="block text-xs text-muted-foreground">From</span><DateTimeField type="time" value={h.start} onChange={(e) => setH({ ...h, start: e.target.value })} className="w-32" /></label>
              <label className="space-y-1"><span className="block text-xs text-muted-foreground">To</span><DateTimeField type="time" value={h.end} onChange={(e) => setH({ ...h, end: e.target.value })} className="w-32" /></label>
              <label className="space-y-1"><span className="block text-xs text-muted-foreground">Timezone</span><select value={h.tz} onChange={(e) => setH({ ...h, tz: e.target.value })} className="h-9 w-56 rounded-md border bg-background px-2 text-sm">
                {(TIMEZONES.includes(h.tz) ? TIMEZONES : [h.tz, ...TIMEZONES]).map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
              </select></label>
            </div>
          </>
        )}
        <Button size="sm" onClick={() => save(on ? h : null)}>Save hours</Button>
      </CardContent>
    </Card>
  );
}

function SettingsPanel({ s, save }: { s: Settings | null; save: (p: SettingsPatch) => void }) {
  const t = useT();
  const [greeting, setGreeting] = useState("");
  const [minutes, setMinutes] = useState(3);
  const [promptMode, setPromptMode] = useState<ChatPromptSetting["mode"]>("bubble");
  const [promptText, setPromptText] = useState("");
  useEffect(() => { if (s) { setGreeting(s.greeting); setMinutes(s.replyMinutes); setPromptMode(s.prompt?.mode ?? "bubble"); setPromptText(s.prompt?.text ?? ""); } }, [s]);
  if (!s) return <Loader2 className="w-5 h-5 animate-spin" />;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("chat.widget")}</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground">{t("chat.widgetHelp")}</p>
            <Switch checked={s.widget || s.aiEnabled} disabled={s.aiEnabled} onCheckedChange={(v) => save({ widget: v })} />
          </div>
          <label className="block space-y-1">
            <span className="font-medium">{t("chat.greeting")}</span>
            <Input value={greeting} placeholder={s.defaultGreeting} maxLength={200} onChange={(e) => setGreeting(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">{t("chat.replyMinutes")}</span>
            <Input type="number" min={1} max={60} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 3)} className="w-28" />
            <span className="block text-xs text-muted-foreground">{t("chat.replyMinutesHelp")}</span>
          </label>
          <label className="block space-y-1">
            <span className="font-medium">{t("chat.prompt")}</span>
            <select value={promptMode} onChange={(e) => setPromptMode(e.target.value as ChatPromptSetting["mode"])}
              className="block w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="bubble">{t("chat.promptBubble")}</option>
              <option value="open">{t("chat.promptOpen")}</option>
              <option value="off">{t("chat.promptOff")}</option>
            </select>
          </label>
          {promptMode === "bubble" && (
            <label className="block space-y-1">
              <span className="font-medium">{t("chat.promptText")}</span>
              <Input value={promptText} placeholder="Questions? Chat with us now" maxLength={80} onChange={(e) => setPromptText(e.target.value)} />
              <span className="block text-xs text-muted-foreground">{t("chat.promptTextHelp")}</span>
            </label>
          )}
          <Button size="sm" onClick={() => save({ greeting, replyMinutes: minutes, prompt: { mode: promptMode, text: promptText.trim() || null } })}>{t("chat.save")}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4" />{t("chat.aiTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <p className={s.aiEnabled ? "text-green-600 font-medium" : "text-muted-foreground"}>{s.aiEnabled ? t("chat.aiOn") : t("chat.aiOff")}</p>
            <Switch checked={s.aiEnabled} onCheckedChange={(v) => save({ aiEnabled: v })} />
          </div>
          <p className="text-muted-foreground">The AI answers visitors instantly, day and night, and hands over to your team when asked. Switch it off to answer every chat yourself.</p>
          {s.aiEnabled && <p className="text-muted-foreground">{t("chat.aiHelp")}</p>}
          {s.aiEnabled && s.credits && !s.credits.unlimited && s.credits.left === 0 && <p className="text-destructive">{t("aiCredits.outChat")}</p>}
          {s.aiEnabled && <AiCreditsBar />}

        </CardContent>
      </Card>
      {s.aiEnabled && s.intake && <IntakeCard s={s.intake} save={(intake) => save({ intake })} />}
      <HoursCard hours={s.hours} save={(hours) => save({ hours })} />
    </div>
  );
}
