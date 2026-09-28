"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";

/**
 * "Chat now" — always visible, even to guests. Signed-out shoppers are sent
 * to sign in and brought straight back, so the feature is discoverable
 * instead of hidden behind login.
 */
export function ChatNowButton({
  vendorId,
  productId,
  className = "",
  label = "Chat now",
  compact = false,
}: {
  vendorId: string;
  productId?: string;
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId, product_id: productId }),
      });
      if (r.status === 401) {
        location.assign(`/account/login?next=${encodeURIComponent(location.pathname)}&reason=chat`);
        return;
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Couldn't open chat");
      router.push(`/account/messages?c=${j.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't open chat");
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={go} disabled={busy} className={className} title={err ?? undefined}>
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
        {compact ? <span className="text-[11px]">{label}</span> : label}
      </button>
      {err && !compact && <span className="text-xs text-red-600">{err}</span>}
    </>
  );
}
