"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const SW = "/push-sw.js";

/** VAPID keys travel as base64url; the browser wants raw bytes. */
function urlBase64ToBytes(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

type State = "unsupported" | "idle" | "on" | "blocked" | "busy";

/**
 * "Turn on notifications" for a signed-in user, backed by
 * /api/push/subscribe and the generic push service worker. Re-syncs an
 * existing subscription silently so a device never goes stale. Renders
 * nothing where the browser can't do push (e.g. iOS Safari outside a
 * home-screen app).
 */
export function PushOptIn({ label = "Get notified of new messages", className = "" }: { label?: string; className?: string }) {
  const [state, setState] = useState<State>("unsupported");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) return;
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.getRegistration(SW);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        }).catch(() => {});
        return setState("on");
      }
      setState("idle");
    })();
  }, []);

  async function enable() {
    setState("busy");
    setErr(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState("blocked");
      const reg = await navigator.serviceWorker.register(SW);
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBytes(VAPID_PUBLIC),
      });
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!r.ok) throw new Error();
      setState("on");
    } catch {
      setErr("Couldn't turn on notifications in this browser.");
      setState("idle");
    }
  }

  if (state === "unsupported") return null;
  if (state === "on")
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-[#16A34A] ${className}`}>
        <BellRing className="w-3.5 h-3.5" /> Notifications on
      </span>
    );
  if (state === "blocked")
    return (
      <span className={`text-xs text-[#667085] ${className}`}>
        Notifications are blocked in your browser settings.
      </span>
    );

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <button
        onClick={enable}
        disabled={state === "busy"}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF5A1F] hover:text-[#E64A0F] disabled:opacity-50"
      >
        {state === "busy" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
        {label}
      </button>
      {err && <span className="text-[11px] text-red-600">{err}</span>}
    </span>
  );
}
