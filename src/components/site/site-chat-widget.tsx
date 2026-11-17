"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackMeta } from "@/components/site/meta-pixel";
import { usePathname } from "next/navigation";
import { compressImageForUpload } from "@/lib/media/client-compress";
import { intakeCopy, type MessageMeta, type VisitCard } from "@/lib/site-chat/intake-copy";

// Site chat widget: live chat with the business on every plan, AI answers
// (streamed) when the site has the assistant on. Rendered inside the
// floating contact stack (floating-contact-buttons.tsx) so the bubble never
// overlaps WhatsApp/Call. Only mounted when chat is on for the site.

type Msg = {
  id: string; role: "visitor" | "ai" | "agent" | "system"; body: string; author_name?: string | null; created_at: string;
  pending?: boolean; streaming?: boolean;
  handoff?: { whatsapp: string | null; phone: string | null } | null;
  meta?: MessageMeta | null;
};
type Session = { id: string; lastAt: number; chat?: boolean }; // chat false: browsing only (heartbeat), no conversation yet

const IDLE_MS = 30 * 60_000;
const KEY = "pc-site-chat";
const API = "/api/site-chat";

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const readSession = (key: string): Session | null => {
  try { const s = JSON.parse(localStorage.getItem(key) || "null") as Session | null; return s?.id && Date.now() - s.lastAt < IDLE_MS ? s : null; } catch { return null; }
};
const writeSession = (key: string, s: Session) => { try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* private mode */ } };
/** First visit ever + visit count (a new session is a new visit), for the team's visitor stats. */
const visitInfo = (sid: string) => {
  try {
    const v = JSON.parse(localStorage.getItem("pc-site-visitor") || "null") as { first: number; visits: number; sid: string } | null;
    const next = !v ? { first: Date.now(), visits: 1, sid } : v.sid === sid ? v : { ...v, visits: v.visits + 1, sid };
    if (next !== v) localStorage.setItem("pc-site-visitor", JSON.stringify(next));
    return next;
  } catch { return { first: Date.now(), visits: 1, sid }; }
};
const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width:640px)").matches;
const time = (iso: string) => { try { return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch { return ""; } };

/** [text](url) and bare URLs become links; everything else stays text. */
function rich(text: string) {
  const out: React.ReactNode[] = [];
  const re = /\[([^\]]{1,120})\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)<]+)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const href = (m[2] ?? m[3]).replace(/[.,;:!?]+$/, "");
    const label = m[1] ?? href.replace(/^https?:\/\/(www\.)?/, "");
    out.push(<a key={k++} href={href} className="pc-chat-link">{label}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Under the message that saved a job request: what happened, and the visitor's own WhatsApp button. */
function VisitBox({ card }: { card: VisitCard }) {
  const c = intakeCopy(card.lang);
  return (
    <div className="pc-chat-visit" dir={card.lang === "ar" ? "rtl" : "ltr"}>
      <b>{card.kind === "visit" ? c.visitTitle(card) : c.leadTitle()}</b>
      {card.when && <span>{card.when}</span>}
      <span>{card.kind === "visit" ? c.visitNote(card) : c.leadNote()}</span>
      {card.whatsapp && <a href={card.whatsapp} target="_blank" rel="noopener noreferrer" className="wa">{c.sendWhatsapp}</a>}
      {card.manageUrl && <a href={card.manageUrl} target="_blank" rel="noopener noreferrer" className="pc-chat-link">{c.manage}</a>}
    </div>
  );
}

/** Language picker above the greeting: the AI welcomes the visitor in the chosen language and keeps to it. */
const CHAT_LANGS = [
  { code: "en", label: "English" }, { code: "bn", label: "বাংলা" }, { code: "ar", label: "العربية" }, { code: "hi", label: "हिन्दी" },
  { code: "ur", label: "اردو" }, { code: "ms", label: "Melayu" }, { code: "zh", label: "中文" },
];

/** Callout text by the site's language when the owner set none. */
function defaultPromptText(): string {
  const l = (document.documentElement.lang || "en").toLowerCase();
  if (l.startsWith("bn")) return "কোনো প্রশ্ন? এখনই চ্যাট করুন";
  if (l.startsWith("ar")) return "لديك سؤال؟ تحدث معنا الآن";
  return "Questions? Chat with us now";
}

export function SiteChatWidget({ greeting, chips, siteName, logoUrl, whatsapp, phone, ai, replyMinutes, expert, intake, prompt = { mode: "bubble", text: null } }: {
  greeting: string; chips: string[]; siteName: string; logoUrl?: string | null; whatsapp?: string | null; phone?: string | null;
  ai: boolean; replyMinutes: number;
  /** Experts directory profile (experts.passivecoder.com): the chat is the expert's own site chat,
   *  resolved from this slug by the API; one session per expert; opened by the Message button. */
  expert?: string;
  /** Job intake, for sites that opted in: photo button and the site visit card. */
  intake?: { word: string } | null;
  /** How the chat invites visitors (owner setting): callout by the button, open the window, or nothing. */
  prompt?: { mode: "bubble" | "open" | "off"; text: string | null };
}) {
  const key = expert ? `${KEY}:${expert}` : KEY;
  const q = expert ? `expert=${encodeURIComponent(expert)}` : "";
  const [open, setOpen] = useState(false);
  // A short invitation beside the chat button instead of opening the chat over the page.
  const [teaser, setTeaser] = useState<string | null>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const [teaserSide, setTeaserSide] = useState("");
  useEffect(() => {
    if (!teaser) return;
    const r = bubbleRef.current?.getBoundingClientRect();
    if (r) setTeaserSide(`${r.left < innerWidth / 2 ? " is-left" : ""}${r.top < innerHeight / 2 ? " is-top" : ""}`);
  }, [teaser]);
  const nudgedRef = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [agent, setAgent] = useState<{ name: string } | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState("en");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [waiting, setWaiting] = useState<number | null>(null); // live mode: when the visitor last wrote
  const [noReply, setNoReply] = useState(false);
  // Out of AI Credits: the team answers, and the visitor can leave their details.
  const [liveOnly, setLiveOnly] = useState(false);
  const [askContact, setAskContact] = useState(false);
  const [lead, setLead] = useState({ name: "", phone: "", sent: false, error: "" });
  const session = useRef<Session | null>(null);
  const lastAtIso = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const openRef = useRef(open);
  openRef.current = open;
  const wa = (whatsapp ?? "").replace(/[^\d]/g, "");

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const byId = new Map(prev.filter((m) => !m.pending && !m.streaming).map((m) => [m.id, m]));
      let fresh = 0;
      for (const m of incoming) { if (!byId.has(m.id)) fresh++; byId.set(m.id, { ...byId.get(m.id), ...m }); }
      const keep = prev.filter((m) => (m.pending || m.streaming) && !incoming.some((i) => i.role === m.role && i.body === m.body));
      const next = [...byId.values(), ...keep].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const replies = incoming.filter((m) => m.role === "agent" || m.role === "ai");
      if (replies.length) { setWaiting(null); setNoReply(false); }
      if (!openRef.current && fresh) setUnread((u) => u + incoming.filter((m) => m.role === "agent").length);
      return next;
    });
    const latest = incoming.reduce((a, m) => (m.created_at > a ? m.created_at : a), lastAtIso.current ?? "");
    lastAtIso.current = latest || lastAtIso.current;
  }, []);

  const poll = useCallback(async () => {
    const s = session.current;
    if (!s) return;
    try {
      const u = `${API}?sessionId=${encodeURIComponent(s.id)}${lastAtIso.current ? `&after=${encodeURIComponent(lastAtIso.current)}` : ""}${q ? `&${q}` : ""}`;
      const j = await fetch(u, { cache: "no-store" }).then((r) => r.json());
      merge((j.messages ?? []) as Msg[]);
      setAgent(j.agent ?? null);
    } catch { /* offline: try again next tick */ }
  }, [merge, q]);

  // Restore an ongoing conversation (persists across pages and reloads).
  useEffect(() => { const s = readSession(key); session.current = s && s.chat !== false ? s : null; if (session.current) poll(); }, [poll, key]);

  // The Experts profile's Message button opens this chat (components/experts/message-button.tsx).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("pc-chat-open", onOpen);
    return () => window.removeEventListener("pc-chat-open", onOpen);
  }, []);

  // Visitor heartbeat (Online now in the team inbox): every 20s while visible
  // and on route change. Shares the chat session id; when the team starts a
  // chat with this visitor, open it as if already started.
  const pathname = usePathname();
  useEffect(() => {
    const pageId = newId(); const t0 = Date.now();
    const beat = async () => {
      const s: Session = { ...(readSession(key) ?? { id: newId(), chat: false }), lastAt: Date.now() };
      writeSession(key, s);
      const v = visitInfo(s.id);
      try {
        const j = await fetch(`${API}/visit${q ? `?${q}` : ""}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
          body: JSON.stringify({ sessionId: s.id, pageId, path: location.pathname, title: document.title, referrer: document.referrer || null, firstSeen: v.first, visits: v.visits, seconds: Math.round((Date.now() - t0) / 1000) }),
        }).then((r) => r.json());
        if (j.chat && !session.current) { session.current = { ...s, chat: true }; writeSession(key, session.current); await poll(); if (isPhone()) setTeaser("We have a message for you."); else setOpen(true); }
      } catch { /* offline */ }
    };
    beat();
    const t = setInterval(() => { if (document.visibilityState === "visible") beat(); }, 20_000);
    return () => clearInterval(t);
  }, [pathname, poll, key, q]);

  // Poll for human replies: fast while open, slow while closed (unread badge).
  useEffect(() => {
    const t = setInterval(() => { if (session.current && !busy) poll(); }, open ? 3000 : 15000);
    return () => clearInterval(t);
  }, [open, busy, poll]);

  // Live chat: nobody answered within replyMinutes -> offer WhatsApp/phone.
  useEffect(() => {
    if (waiting == null) return;
    const ms = Math.max(0, waiting + replyMinutes * 60_000 - Date.now());
    const t = setTimeout(() => setNoReply(true), ms);
    return () => clearTimeout(t);
  }, [waiting, replyMinutes]);

  useEffect(() => {
    if (open) { setUnread(0); setTeaser(null); if (!nudgedRef.current && !isPhone()) setTimeout(() => inputRef.current?.focus(), 200); /* the keyboard opens only when a phone visitor taps the box */ }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Nudge, once per visit (across pages, this tab), unless they already chatted
  // or opened the chat: by default a callout beside the button after 8s; sites
  // that chose "open" get the window after 60s (phones still get the callout).
  const [nudged, setNudged] = useState(false);
  useEffect(() => {
    const K = "pc-chat-nudge";
    // Directory profiles: the visitor opens the expert's chat with Message, no nudge.
    if (expert || prompt.mode === "off") return;
    const bubble = prompt.mode !== "open";
    try {
      if (sessionStorage.getItem(`${K}-done`)) return;
      const start = Number(sessionStorage.getItem(`${K}-start`)) || Date.now();
      sessionStorage.setItem(`${K}-start`, String(start));
      const t = setTimeout(() => {
        if (sessionStorage.getItem(`${K}-done`) || session.current) return;
        sessionStorage.setItem(`${K}-done`, "1");
        setNudged(true);
        if (bubble) { setTeaser(prompt.text || defaultPromptText()); return; }
        if (isPhone()) { setTeaser("Need any help? Ask me anything."); return; }
        nudgedRef.current = true; setOpen(true);
      }, Math.max(0, start + (bubble ? 8_000 : 60_000) - Date.now()));
      return () => clearTimeout(t);
    } catch { /* storage blocked */ }
  }, [expert, prompt.mode, prompt.text]);
  useEffect(() => { if (open) try { sessionStorage.setItem("pc-chat-nudge-done", "1"); } catch { /* storage blocked */ } }, [open]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, typing, open, noReply]);

  const lastQuestion = [...messages].reverse().find((m) => m.role === "visitor")?.body ?? "";
  const waHref = wa ? `https://wa.me/${wa}${lastQuestion ? `?text=${encodeURIComponent(lastQuestion.slice(0, 500))}` : ""}` : null;

  async function send(text: string, pickLang?: string) {
    const body = text.trim().slice(0, 800);
    if (!body || busy) return;
    let s = session.current && Date.now() - session.current.lastAt < IDLE_MS ? session.current : null;
    if (!s) { s = { id: readSession(key)?.id ?? newId(), lastAt: Date.now() }; setMessages([]); lastAtIso.current = null; setAgent(null); }
    s = { ...s, lastAt: Date.now(), chat: true };
    session.current = s; writeSession(key, s);
    const tmpId = `tmp-${Date.now()}`;
    setMessages((p) => [...p, { id: tmpId, role: "visitor", body, created_at: new Date().toISOString(), pending: true }]);
    setInput(""); setBusy(true); setNoReply(false);
    const fail = (reply: string, handoff: Msg["handoff"]) => setMessages((p) => [...p.map((m) => (m.id === tmpId ? { ...m, pending: false } : m)),
      { id: `sys-${Date.now()}`, role: "ai", body: reply, created_at: new Date().toISOString(), handoff }]);
    try {
      const res = await fetch(`${API}${q ? `?${q}` : ""}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: s.id, message: body, page: location.pathname, lang: navigator.language, ...(pickLang ? { pickLang } : {}) }),
      });
      if ((res.headers.get("content-type") ?? "").includes("text/event-stream") && res.body) {
        setTyping(true);
        const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; const sid = `stream-${Date.now()}`;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n\n")) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
            if (!line.startsWith("data:")) continue;
            let ev: { t: string; v?: string; message?: Msg | null; reply?: string; handoff?: Msg["handoff"]; lead?: boolean };
            try { ev = JSON.parse(line.slice(5)); } catch { continue; }
            if (ev.t === "visitor" && ev.message) setMessages((p) => p.map((m) => (m.id === tmpId ? { ...ev.message!, role: "visitor" } : m)));
            else if (ev.t === "delta" && ev.v) {
              setTyping(false);
              setMessages((p) => p.some((m) => m.id === sid)
                ? p.map((m) => (m.id === sid ? { ...m, body: m.body + ev.v } : m))
                : [...p, { id: sid, role: "ai", body: ev.v!, created_at: new Date().toISOString(), streaming: true }]);
            } else if (ev.t === "done") {
              setMessages((p) => [...p.filter((m) => m.id !== sid), ...(ev.message ? [{ ...ev.message, handoff: ev.handoff ?? null }] : [])]
                .sort((a, b) => a.created_at.localeCompare(b.created_at)));
              if (ev.message) lastAtIso.current = ev.message.created_at;
              if (ev.lead) trackMeta("Lead", { content_name: "Website chat" });
            } else if (ev.t === "error") {
              setMessages((p) => p.filter((m) => m.id !== sid));
              fail(ev.reply ?? "Sorry, please message us on WhatsApp.", ev.handoff ?? null);
            }
          }
        }
        setTyping(false);
      } else {
        const j = await res.json().catch(() => ({}));
        if (j.message) setMessages((p) => p.map((m) => (m.id === tmpId ? j.message : m)));
        else setMessages((p) => p.map((m) => (m.id === tmpId ? { ...m, pending: false } : m)));
        if (j.message?.created_at) lastAtIso.current = j.message.created_at;
        if (j.reply) fail(j.reply, j.handoff ?? null);
        if (j.mode === "live") setWaiting(Date.now());
        if (j.askContact) { setLiveOnly(true); setAskContact(true); }
      }
    } catch {
      setTyping(false);
      fail("Sorry, I could not send that. Please message us on WhatsApp.", { whatsapp: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(body)}` : null, phone: phone ?? null });
    }
    setBusy(false);
  }

  // Job photos (sites with intake on): compressed in the browser, stored by
  // /api/site-chat/photo, then one message tells the assistant they arrived.
  const copy = intakeCopy(lang === "ar" || (lang === "en" && /[\u0600-\u06FF]/.test(lastQuestion)) ? "ar" : "en");
  async function sendPhotos(files: FileList | null) {
    const s = session.current;
    if (!s || !files?.length || uploading || busy) return;
    setUploading(true); setPhotoError("");
    let sent = 0;
    for (const f of Array.from(files).slice(0, 5)) {
      const fd = new FormData();
      fd.set("sessionId", s.id);
      fd.set("file", await compressImageForUpload(f));
      const r = await fetch(`${API}/photo${q ? `?${q}` : ""}`, { method: "POST", body: fd })
        .then(async (x) => ({ ok: x.ok, j: await x.json().catch(() => ({})) })).catch(() => ({ ok: false, j: {} as { error?: string; message?: Msg } }));
      if (!r.ok) { setPhotoError(r.j.error ?? copy.photoFail); break; }
      if (r.j.message) merge([r.j.message as Msg]);
      sent++;
    }
    setUploading(false);
    if (photoRef.current) photoRef.current.value = "";
    if (sent) await send(copy.photosSent(sent));
  }

  async function sendLead(e: React.FormEvent) {
    e.preventDefault();
    const s = session.current;
    if (!s || !lead.name.trim() || !lead.phone.trim()) return;
    const r = await fetch(`${API}${q ? `?${q}` : ""}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: s.id, lead: { name: lead.name, phone: lead.phone } }),
    }).then((x) => x.json()).catch(() => ({ ok: false }));
    if (r.ok) { setLead({ ...lead, sent: true, error: "" }); trackMeta("Lead", { content_name: "Website chat" }); }
    else setLead({ ...lead, error: r.error ?? "Could not save that. Please try again." });
  }

  const subtitle = agent ? `${agent.name} is here to help` : ai && !liveOnly ? "AI assistant · replies instantly" : `We usually reply within ${replyMinutes} min`;

  return (
    <>
      <style precedence="pc-floating" href="pc-site-chat" dangerouslySetInnerHTML={{ __html: CSS }} />
      {open && <div className="pc-chat-scrim" aria-hidden="true" onClick={() => setOpen(false)} />}
      {teaser && !open && (
        <div className={`pc-chat-teaser${teaserSide}`}>
          <button type="button" className="pc-chat-teaser-text" onClick={() => setOpen(true)}>{teaser}</button>
          <button type="button" className="pc-chat-teaser-x" aria-label="Dismiss" onClick={() => setTeaser(null)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
      )}
      <button ref={bubbleRef} type="button" className={`pc-chat-bubble${open ? " is-open" : ""}`} aria-label={open ? "Close chat" : "Chat with us"} aria-expanded={open} title="Chat with us" onClick={() => setOpen((o) => !o)}>
        <svg className="i-chat" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" />
        </svg>
        <svg className="i-close" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        {unread > 0 && !open && <span className="pc-chat-badge" aria-label={`${unread} new messages`}>{unread}</span>}
      </button>

      <div className={`pc-chat-panel${open ? " is-open" : ""}`} role="dialog" aria-modal="false" aria-label={`Chat with ${siteName}`} aria-hidden={!open} inert={!open}>
        <header>
          <span className="pc-chat-av">
            {logoUrl && !agent
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoUrl} alt="" />
              : <b>{(agent?.name ?? siteName).slice(0, 1).toUpperCase()}</b>}
            <i className="pc-chat-dot" aria-hidden="true" />
          </span>
          <div className="pc-chat-hd">
            <div className="pc-chat-name">{siteName}</div>
            <div className="pc-chat-sub">{subtitle}</div>
          </div>
          <button type="button" className="pc-chat-x" onClick={() => setOpen(false)} aria-label="Close chat">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>

        <div className="pc-chat-list" ref={listRef} aria-live="polite" aria-relevant="additions">
          {ai && (
            <div className="pc-chat-langs" role="group" aria-label="Chat language">
              {CHAT_LANGS.map((l) => (
                <button key={l.code} type="button" className={`pc-chat-lang${lang === l.code ? " on" : ""}`} disabled={busy}
                  onClick={() => { if (lang === l.code) return; setLang(l.code); if (l.code !== "en" || messages.length) send(l.label, l.code); }}>{l.label}</button>
              ))}
            </div>
          )}
          <div className="pc-chat-row a"><div className="pc-chat-msg a">{greeting}</div></div>
          {nudged && messages.length === 0 && <div className="pc-chat-row a"><div className="pc-chat-msg a">Need any help? Ask me anything, in your own language.</div></div>}
          {messages.length === 0 && chips.length > 0 && (
            <div className="pc-chat-chips">{chips.map((c) => <button key={c} type="button" className="pc-chat-chip" onClick={() => send(c)}>{c}</button>)}</div>
          )}
          {messages.map((m) => m.role === "system" ? (
            <div key={m.id} className="pc-chat-sys">{m.body}</div>
          ) : (
            <div key={m.id} className={`pc-chat-row ${m.role === "visitor" ? "u" : "a"}`}>
              {m.role === "agent" && <span className="pc-chat-who">{m.author_name ?? "Team"}</span>}
              <div className={`pc-chat-msg ${m.role === "visitor" ? "u" : "a"}`} dir="auto">
                {m.meta?.photos?.length
                  ? m.meta.photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt={copy.photoAlt} className="pc-chat-photo" loading="lazy" /></a>
                  ))
                  : m.role === "visitor" ? m.body : rich(m.body)}
                {m.streaming && <span className="pc-chat-caret" aria-hidden="true" />}
                {m.meta?.visit && <VisitBox card={m.meta.visit} />}
                {m.handoff && (m.handoff.whatsapp || m.handoff.phone) && (
                  <div className="pc-chat-ho">
                    {m.handoff.whatsapp && <a href={m.handoff.whatsapp} target="_blank" rel="noopener noreferrer" className="wa">Chat with us on WhatsApp</a>}
                    {m.handoff.phone && <a href={`tel:+${m.handoff.phone.replace(/[^\d]/g, "")}`} className="tel">Call {m.handoff.phone}</a>}
                  </div>
                )}
              </div>
              {!m.streaming && (
                <span className="pc-chat-meta">{time(m.created_at)}{m.role === "visitor" && <> · {m.pending ? "Sending" : "Delivered ✓"}</>}</span>
              )}
            </div>
          ))}
          {typing && <div className="pc-chat-row a"><div className="pc-chat-msg a pc-chat-typing" aria-label="Typing"><i /><i /><i /></div></div>}
          {askContact && (lead.sent
            ? <div className="pc-chat-sys">Thanks, our team will contact you soon.</div>
            : (
              <form className="pc-chat-lead" onSubmit={sendLead}>
                <p>Leave your details and our team will get back to you.</p>
                <input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} maxLength={120} placeholder="Your name" aria-label="Your name" required />
                <input value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} maxLength={40} placeholder="Phone number" aria-label="Phone number" inputMode="tel" required />
                {lead.error && <p className="err">{lead.error}</p>}
                <button type="submit">Send</button>
              </form>
            ))}
          {noReply && (
            <div className="pc-chat-sys">
              We usually reply within {replyMinutes} min. You can also reach us now:
              <div className="pc-chat-ho" style={{ justifyContent: "center" }}>
                {waHref && <a href={waHref} target="_blank" rel="noopener noreferrer" className="wa">WhatsApp us</a>}
                {phone && <a href={`tel:+${phone.replace(/[^\d]/g, "")}`} className="tel">Call {phone}</a>}
              </div>
            </div>
          )}
        </div>

        {(uploading || photoError) && <div className="pc-chat-sys pc-chat-photo-note" dir="auto">{uploading ? copy.uploading : photoError}</div>}
        <form className="pc-chat-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          {intake && messages.length > 0 && (
            <>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden aria-hidden="true" tabIndex={-1} onChange={(e) => sendPhotos(e.target.files)} />
              <button type="button" className="pc-chat-camera" disabled={busy || uploading} aria-label={copy.addPhoto} title={copy.addPhoto} onClick={() => photoRef.current?.click()}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" /></svg>
              </button>
            </>
          )}
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={800} placeholder="Write a message…" aria-label="Your message" enterKeyHint="send" dir="auto" />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
          </button>
        </form>
        {waHref && <div className="pc-chat-foot"><a href={waHref} target="_blank" rel="noopener noreferrer">Talk to a person on WhatsApp</a></div>}
      </div>
    </>
  );
}

const CSS = `
.pc-chat-bubble{position:relative;width:56px;height:56px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25);background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:0;cursor:pointer;transition:transform .2s ease}
.pc-chat-bubble:hover{transform:scale(1.07)}
.pc-chat-bubble svg{position:absolute;transition:transform .25s ease,opacity .2s ease}
.pc-chat-bubble .i-close{opacity:0;transform:rotate(-90deg) scale(.6)}
.pc-chat-bubble.is-open .i-chat{opacity:0;transform:rotate(90deg) scale(.6)}
.pc-chat-bubble.is-open .i-close{opacity:1;transform:none}
.pc-chat-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:9999px;background:#ef4444;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;animation:pc-chat-pop .3s ease}
@keyframes pc-chat-pop{from{transform:scale(0)}to{transform:scale(1)}}
.pc-chat-panel{position:fixed;right:20px;bottom:var(--pc-chat-bottom,88px);z-index:9995;width:380px;max-width:calc(100vw - 24px);height:min(620px,calc(100vh - var(--pc-chat-bottom,88px) - 24px));display:flex;flex-direction:column;background:hsl(var(--background));color:hsl(var(--foreground));border:1px solid hsl(var(--border));border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.28);overflow:hidden;font-size:14px;opacity:0;transform:translateY(16px) scale(.97);transform-origin:bottom right;pointer-events:none;visibility:hidden;transition:opacity .22s ease,transform .22s ease,visibility 0s linear .22s}
.pc-chat-panel.is-open{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition:opacity .22s ease,transform .22s ease}
.pc-chat-panel header{display:flex;align-items:center;gap:10px;padding:14px;background:hsl(var(--primary));color:hsl(var(--primary-foreground))}
.pc-chat-av{position:relative;width:38px;height:38px;flex:none;border-radius:9999px;background:rgba(255,255,255,.95);color:hsl(var(--primary));display:flex;align-items:center;justify-content:center;font-size:16px}
.pc-chat-av img{width:100%;height:100%;object-fit:contain;border-radius:9999px;padding:4px}
.pc-chat-dot{position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:9999px;background:#22c55e;border:2px solid hsl(var(--primary))}
.pc-chat-hd{flex:1;min-width:0}
.pc-chat-name{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pc-chat-sub{font-size:12px;opacity:.85}
.pc-chat-x{background:transparent;border:0;color:inherit;cursor:pointer;padding:6px;border-radius:9999px;display:flex}
.pc-chat-x:hover{background:rgba(255,255,255,.15)}
.pc-chat-list{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain;background:hsl(var(--muted)/.35)}
.pc-chat-row{display:flex;flex-direction:column;max-width:86%;animation:pc-chat-in .2s ease}
.pc-chat-row.u{align-self:flex-end;align-items:flex-end}
.pc-chat-row.a{align-self:flex-start;align-items:flex-start}
@keyframes pc-chat-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.pc-chat-msg{padding:9px 13px;border-radius:16px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
.pc-chat-msg.u{background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-bottom-right-radius:5px}
.pc-chat-msg.a{background:hsl(var(--card,var(--background)));color:hsl(var(--foreground));border:1px solid hsl(var(--border));border-bottom-left-radius:5px}
.pc-chat-link{color:inherit;text-decoration:underline;text-underline-offset:2px;font-weight:600}
.pc-chat-who{font-size:11px;font-weight:600;color:hsl(var(--muted-foreground));margin:0 0 3px 4px}
.pc-chat-meta{font-size:11px;color:hsl(var(--muted-foreground));margin:3px 4px 0}
.pc-chat-sys{align-self:center;text-align:center;font-size:12px;color:hsl(var(--muted-foreground));background:hsl(var(--muted));padding:6px 12px;border-radius:12px;max-width:92%}
.pc-chat-chips{display:flex;flex-wrap:wrap;gap:6px}
.pc-chat-langs{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding-bottom:4px;border-bottom:1px solid hsl(var(--border));margin-bottom:4px}
.pc-chat-lang{border:1px solid hsl(var(--border));background:hsl(var(--background));color:hsl(var(--muted-foreground));border-radius:9999px;padding:3px 9px;font-size:12px;cursor:pointer}
.pc-chat-lang.on{border-color:hsl(var(--primary));background:hsl(var(--primary));color:hsl(var(--primary-foreground))}
.pc-chat-lang:disabled{opacity:.6;cursor:default}
.pc-chat-chip{border:1px solid hsl(var(--primary));color:hsl(var(--primary));background:hsl(var(--background));border-radius:9999px;padding:6px 12px;font-size:13px;cursor:pointer;transition:background .15s}
.pc-chat-chip:hover{background:hsl(var(--primary)/.08)}
.pc-chat-typing{display:flex;gap:4px;align-items:center;padding:12px 14px}
.pc-chat-typing i{width:7px;height:7px;border-radius:9999px;background:hsl(var(--muted-foreground));animation:pc-chat-b 1.2s infinite ease-in-out}
.pc-chat-typing i:nth-child(2){animation-delay:.15s}.pc-chat-typing i:nth-child(3){animation-delay:.3s}
@keyframes pc-chat-b{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.pc-chat-caret{display:inline-block;width:6px;height:14px;margin-left:2px;vertical-align:-2px;background:currentColor;opacity:.5;animation:pc-chat-c 1s steps(2) infinite}
@keyframes pc-chat-c{50%{opacity:0}}
.pc-chat-lead{display:flex;flex-direction:column;gap:6px;align-self:stretch;padding:10px;border:1px solid hsl(var(--border));border-radius:12px;background:hsl(var(--card,var(--background)))}
.pc-chat-lead p{margin:0;font-size:13px}
.pc-chat-lead p.err{color:#dc2626}
.pc-chat-lead input{border:1px solid hsl(var(--border));border-radius:8px;padding:8px 10px;background:hsl(var(--background));color:hsl(var(--foreground));font-size:16px;outline:none}
.pc-chat-lead input:focus{border-color:hsl(var(--primary))}
.pc-chat-lead button{border:0;border-radius:8px;padding:8px 12px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));font-weight:600;cursor:pointer}
.pc-chat-ho{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.pc-chat-ho a{display:inline-flex;align-items:center;padding:6px 12px;border-radius:9999px;font-size:13px;font-weight:600;text-decoration:none}
.pc-chat-ho a.wa{background:#25D366;color:#fff}
.pc-chat-ho a.tel{background:hsl(var(--primary));color:hsl(var(--primary-foreground))}
.pc-chat-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid hsl(var(--border));background:hsl(var(--background))}
.pc-chat-form input{flex:1;min-width:0;border:1px solid hsl(var(--border));border-radius:9999px;padding:10px 15px;background:hsl(var(--background));color:hsl(var(--foreground));font-size:16px;outline:none}
.pc-chat-form input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 3px hsl(var(--primary)/.15)}
.pc-chat-form button{flex:none;width:42px;height:42px;border:0;border-radius:9999px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity .15s}
.pc-chat-form button:disabled{opacity:.45;cursor:default}
.pc-chat-form button.pc-chat-camera{background:transparent;color:hsl(var(--foreground));border:1px solid hsl(var(--border))}
.pc-chat-photo{display:block;max-width:100%;max-height:220px;border-radius:10px;object-fit:cover}
.pc-chat-photo-note{margin:0 12px 8px}
.pc-chat-visit{display:flex;flex-direction:column;gap:3px;margin-top:8px;padding:9px 11px;border:1px solid hsl(var(--border));border-radius:12px;background:hsl(var(--muted)/.5);font-size:13px}
.pc-chat-visit a.wa{align-self:flex-start;margin-top:6px;padding:7px 13px;border-radius:9999px;background:#25D366;color:#fff;font-weight:600;text-decoration:none}
.pc-chat-foot{padding:0 12px 10px;text-align:center;font-size:12px;background:hsl(var(--background))}
.pc-chat-foot a{color:#128C7E;font-weight:600;text-decoration:none}
.pc-chat-scrim{display:none}
.pc-chat-teaser{position:absolute;right:calc(100% + 12px);bottom:8px;z-index:9993;display:flex;align-items:center;gap:2px;width:max-content;max-width:min(280px,calc(100vw - 100px));background:hsl(var(--background));color:hsl(var(--foreground));border:1px solid hsl(var(--primary));border-radius:14px 14px 4px 14px;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:pc-chat-in .25s ease}
.pc-chat-teaser.is-left{right:auto;left:calc(100% + 12px);border-radius:14px 14px 14px 4px}
.pc-chat-teaser.is-top{bottom:auto;top:8px}
.pc-chat-teaser-text{background:none;border:0;color:inherit;font-size:14px;font-weight:600;text-align:start;padding:10px 0 10px 12px;cursor:pointer}
.pc-chat-teaser-x{background:none;border:0;color:hsl(var(--muted-foreground));padding:8px;cursor:pointer;display:flex}
@media(max-width:640px){
.pc-chat-bubble{width:52px;height:52px}
.pc-chat-bubble.is-open{opacity:0;pointer-events:none}
.pc-chat-panel{inset:auto 0 0 0;width:100%;max-width:none;height:80vh;height:80dvh;border-radius:20px 20px 0 0;border-width:1px 0 0;transform:translateY(100%);transform-origin:bottom}
.pc-chat-scrim{display:block;position:fixed;inset:0;z-index:9994;background:rgba(0,0,0,.4)}
.pc-chat-teaser-text{font-size:13px}
.pc-chat-foot{padding-bottom:calc(10px + env(safe-area-inset-bottom))}
}
@media(prefers-reduced-motion:reduce){.pc-chat-panel,.pc-chat-row,.pc-chat-bubble svg{transition:none;animation:none}}
@media print{.pc-chat-panel,.pc-chat-bubble{display:none}}`;
