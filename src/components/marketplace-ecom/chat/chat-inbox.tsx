"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ImagePlus, Loader2, MessageCircle, Send, Store, User, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { waLink } from "@/lib/marketplace-ecom/wa";
import { PushOptIn } from "@/components/push/push-opt-in";

type Role = "buyer" | "vendor";

interface ProductRef { id?: string; name: string; slug: string; images: string[] | null; price: number }
interface ConvRow {
  id: string;
  title: string;
  avatar: string | null;
  product: ProductRef | null;
  last_message: string | null;
  last_message_at: string;
  unread: number;
}
interface Msg {
  id: string;
  sender_role: Role;
  body: string | null;
  image_url: string | null;
  product_id: string | null;
  created_at: string;
  products?: ProductRef | null;
}
interface Thread {
  role: Role;
  counterpart: { name: string; avatar: string | null; phone: string | null; shop_slug?: string | null };
  product: ProductRef | null;
  messages: Msg[];
}

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

function when(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

/**
 * Buyer <-> seller messaging, shared by the shopper's /account/messages and
 * the seller's /vendor/messages — one component so both sides always look
 * and behave the same. Live via Supabase Realtime (RLS limits delivery to
 * the two parties) with a light poll as a fallback for flaky connections.
 */
export function ChatInbox({ as, siteName }: { as: Role; siteName: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("c");
  const [convs, setConvs] = useState<ConvRow[] | null>(null);

  const loadList = useCallback(async () => {
    const r = await fetch(`/api/chat/conversations${as === "vendor" ? "?as=vendor" : ""}`);
    if (r.status === 401) {
      router.push(`/account/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    const j = await r.json();
    setConvs(j.conversations ?? []);
  }, [as, router]);

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 20000);
    return () => clearInterval(t);
  }, [loadList]);

  const base = as === "vendor" ? "/vendor/messages" : "/account/messages";
  const open = (id: string | null) => router.push(id ? `${base}?c=${id}` : base, { scroll: false });

  return (
    <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden h-[calc(100dvh-240px)] min-h-[420px] grid md:grid-cols-[320px_1fr]">
      {/* List */}
      <aside className={`${activeId ? "hidden md:flex" : "flex"} flex-col border-r border-[#EAECF0] min-h-0`}>
        <div className="px-4 py-3 border-b border-[#EAECF0] flex items-center justify-between gap-2">
          <h2 className="font-bold text-[#1A1330]">Chats</h2>
          <PushOptIn label="Notify me" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs === null ? (
            <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#FF5A1F]" /></div>
          ) : convs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#667085]">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#D0D5DD]" />
              {as === "vendor"
                ? "No messages yet. Buyers can chat with you from any of your product pages."
                : "No chats yet. Tap “Chat now” on any product to ask the seller a question."}
            </div>
          ) : (
            convs.map((c) => (
              <button
                key={c.id}
                onClick={() => open(c.id)}
                className={`w-full text-left px-4 py-3 flex gap-3 border-b border-[#F2F4F7] hover:bg-[#FFF6F2] transition-colors ${c.id === activeId ? "bg-[#FFF1EB]" : ""}`}
              >
                <Avatar src={c.avatar} vendor={as === "buyer"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1A1330] truncate">{c.title}</span>
                    <span className="ml-auto text-[11px] text-[#98A2B3] shrink-0">{when(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs truncate ${c.unread ? "text-[#1A1330] font-semibold" : "text-[#667085]"}`}>
                      {c.last_message ?? (c.product ? `About: ${c.product.name}` : "New chat")}
                    </span>
                    {c.unread > 0 && (
                      <span className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#FF5A1F] text-white text-[11px] font-bold flex items-center justify-center">
                        {c.unread > 99 ? "99+" : c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`${activeId ? "flex" : "hidden md:flex"} flex-col min-h-0`}>
        {activeId ? (
          <ThreadView key={activeId} id={activeId} siteName={siteName} onBack={() => open(null)} onSent={loadList} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-[#98A2B3]">Select a chat</div>
        )}
      </section>
    </div>
  );
}

function Avatar({ src, vendor }: { src: string | null; vendor: boolean }) {
  return (
    <span className="w-10 h-10 rounded-full overflow-hidden bg-[#FFF1EB] flex items-center justify-center shrink-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : vendor ? (
        <Store className="w-5 h-5 text-[#FF5A1F]" />
      ) : (
        <User className="w-5 h-5 text-[#FF5A1F]" />
      )}
    </span>
  );
}

function ThreadView({ id, siteName, onBack, onSent }: { id: string; siteName: string; onBack: () => void; onSent: () => void }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [waPrompt, setWaPrompt] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/chat/conversations/${id}`);
    if (!r.ok) return setError(r.status === 404 ? "Chat not found" : "Couldn't load this chat");
    setThread(await r.json());
  }, [id]);

  const addMessages = useCallback((incoming: Msg[]) => {
    setThread((t) => {
      if (!t) return t;
      const seen = new Set(t.messages.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? { ...t, messages: [...t.messages, ...fresh] } : t;
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime + poll fallback. Re-fetching via the API (not trusting the
  // realtime payload) also marks the thread read and joins product details.
  useEffect(() => {
    const supabase = createClient();
    const catchUp = async () => {
      const r = await fetch(`/api/chat/conversations/${id}`);
      if (r.ok) addMessages(((await r.json()) as Thread).messages);
    };
    const channel = supabase
      .channel(`chat-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${id}` }, catchUp)
      .subscribe();
    const t = setInterval(catchUp, 10000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [id, addMessages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  async function send(payload: { body?: string; image_url?: string }) {
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/chat/conversations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Couldn't send");
      addMessages([j.message]);
      setText("");
      onSent();
      if (thread?.counterpart.phone) {
        const preview = payload.body ?? "a photo";
        const link = `${location.origin}${thread.role === "buyer" ? "/vendor/messages" : "/account/messages"}?c=${id}`;
        const msg =
          thread.role === "buyer"
            ? `Hi ${thread.counterpart.name}, I sent you a message on ${siteName}: "${preview.slice(0, 200)}". Please reply here: ${link}`
            : `Hi ${thread.counterpart.name}, ${siteName} seller here. I replied to your message: "${preview.slice(0, 200)}". See it here: ${link}`;
        setWaPrompt(waLink(thread.counterpart.phone, msg));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      setSending(false);
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/chat/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      await send({ image_url: j.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (error && !thread) return <div className="flex-1 flex items-center justify-center text-sm text-red-600">{error}</div>;
  if (!thread) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#FF5A1F]" /></div>;

  const me = thread.role;
  const p = thread.product;

  return (
    <>
      <header className="px-3 py-2.5 border-b border-[#EAECF0] flex items-center gap-3">
        <button onClick={onBack} className="md:hidden p-1 -ml-1" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar src={thread.counterpart.avatar} vendor={me === "buyer"} />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[#1A1330] truncate">{thread.counterpart.name}</p>
          {me === "buyer" && thread.counterpart.shop_slug && (
            <Link href={`/shop?vendor=${thread.counterpart.shop_slug}`} className="text-xs text-[#FF5A1F]">Visit shop</Link>
          )}
        </div>
      </header>

      {p && (
        <Link href={`/products/${p.slug}`} className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-[#EAECF0] p-2 hover:border-[#FF5A1F]">
          {p.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-xs text-[#667085]">Asking about</p>
            <p className="text-sm font-medium text-[#1A1330] truncate">{p.name}</p>
            <p className="text-sm font-bold text-[#FF5A1F]">{tk(p.price)}</p>
          </div>
        </Link>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-[#FAFAFB]">
        {thread.messages.length === 0 && (
          <p className="text-center text-xs text-[#98A2B3] py-6">
            {me === "buyer" ? "Ask about stock, sizes, delivery — the seller usually replies quickly." : "Say hello to your customer."}
          </p>
        )}
        {thread.messages.map((m) => {
          const mine = m.sender_role === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-[#FF5A1F] text-white rounded-br-sm" : "bg-white text-[#1A1330] border border-[#EAECF0] rounded-bl-sm"}`}>
                {m.image_url && (
                  <a href={m.image_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.image_url} alt="Photo" className="rounded-lg max-h-60 mb-1" />
                  </a>
                )}
                {m.products && (
                  <Link href={`/products/${m.products.slug}`} className={`block rounded-lg p-2 mb-1 ${mine ? "bg-white/15" : "bg-[#F5F5F7]"}`}>
                    <span className="font-medium">{m.products.name}</span> · {tk(m.products.price)}
                  </Link>
                )}
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                <p className={`text-[10px] mt-0.5 text-right ${mine ? "text-white/75" : "text-[#98A2B3]"}`}>{when(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {waPrompt && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-[#E8F8EE] border border-[#BDEBCD] px-3 py-2">
          <span className="text-xs text-[#14532D] flex-1">Want {thread.counterpart.name} to see it sooner?</span>
          <a
            href={waPrompt}
            target="_blank"
            rel="noreferrer"
            onClick={() => setWaPrompt(null)}
            className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5A] text-white text-xs font-bold px-3 py-1.5 rounded-full"
          >
            <WhatsAppIcon /> Notify on WhatsApp
          </a>
          <button onClick={() => setWaPrompt(null)} aria-label="Dismiss" className="text-[#14532D]/60">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="px-3 pb-1 text-xs text-red-600">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) send({ body: text.trim() });
        }}
        className="border-t border-[#EAECF0] p-2 flex items-end gap-2"
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPickImage} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="p-2.5 rounded-full text-[#667085] hover:bg-[#F2F4F7] disabled:opacity-50"
          aria-label="Send a photo"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) send({ body: text.trim() });
            }
          }}
          rows={1}
          placeholder="Type a message"
          className="flex-1 resize-none max-h-32 rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="p-2.5 rounded-full bg-[#FF5A1F] text-white hover:bg-[#E64A0F] disabled:opacity-40"
          aria-label="Send"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.45 9.43M20.1 3.9A11.3 11.3 0 0 0 12.05.56C5.8.56.7 5.66.7 11.92c0 2 .52 3.95 1.52 5.67L.6 23.44l5.99-1.57a11.3 11.3 0 0 0 5.45 1.39h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.32-8.03" />
    </svg>
  );
}
