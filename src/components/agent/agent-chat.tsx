"use client";

import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAgentContext } from "./agent-context";
import { AgentPendingActionCard, type PendingActionData } from "./agent-pending-action-card";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export function AgentChat() {
  const { scope, pageId } = useAgentContext();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingActionData[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages(prev => [...prev, { id: `local-${Date.now()}`, role: "user", content: text }]);

    try {
      const res = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          context: { scope, pageId: pageId ?? undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: data.error ?? "Something went wrong." }]);
        return;
      }
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, { id: `reply-${Date.now()}`, role: "assistant", content: data.reply }]);
      if (data.pendingActions?.length) {
        setPendingActions(prev => [...prev, ...data.pendingActions]);
      }
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "Couldn't reach the agent — try again." }]);
    } finally {
      setSending(false);
    }
  }

  function onResolved(id: string, status: "confirmed" | "cancelled") {
    setPendingActions(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
  }

  return (
    <div className="flex flex-col h-[520px]">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {scope === "editor"
              ? "Ask me to check or update this page, or generate new content for it."
              : "Ask me about your site, leads, or pages."}
          </p>
        )}
        {messages.map(m => (
          <div
            key={m.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap",
              m.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted",
            )}
          >
            {m.content}
          </div>
        ))}
        {pendingActions.map(a => (
          <AgentPendingActionCard key={a.id} action={a} onResolved={onResolved} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-3 flex gap-2 items-end shrink-0">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask the agent…"
          rows={1}
          className="min-h-9 resize-none text-sm"
        />
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={send} disabled={sending || !input.trim()}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
