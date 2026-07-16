"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, Check, X } from "lucide-react";
import { donorApi } from "@/app/(site)/donors/ui";

const DISMISS_KEY = "donor_push_dismissed";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** VAPID keys travel as base64url; the browser wants raw bytes. */
function urlBase64ToBytes(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Asks a logged-in donor to enable browser notifications so urgent requests
 * reach them even with the site closed. Shown once; dismissal is remembered
 * locally. Hidden entirely where the browser can't do push.
 */
export function PushConsent() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (typeof window === "undefined") return;
    const supported = "serviceWorker" in navigator && "PushManager" in window && !!VAPID_PUBLIC;
    if (!supported) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (Notification.permission === "denied") return;

    const me = await donorApi("/api/donors/auth/me", "GET");
    if (!me.data?.donor) return;

    // Already subscribed? Refresh the server's copy and stay quiet.
    const reg = await navigator.serviceWorker.getRegistration("/donor-sw.js");
    const existing = await reg?.pushManager.getSubscription();
    if (existing) {
      await donorApi("/api/donors/webpush", "POST", existing.toJSON());
      return;
    }
    setShow(true);
  }, []);

  useEffect(() => { check(); }, [check]);

  async function enable() {
    setBusy(true); setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setBusy(false);
        setError("Notifications are blocked — enable them in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/donor-sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBytes(VAPID_PUBLIC),
      });
      const r = await donorApi("/api/donors/webpush", "POST", sub.toJSON());
      setBusy(false);
      if (!r.ok) { setError(r.data.error ?? "Couldn't save your subscription"); return; }
      localStorage.setItem(DISMISS_KEY, "1");
      setShow(false);
    } catch {
      setBusy(false);
      setError("Couldn't turn on notifications in this browser.");
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-800">
              Get notified when someone nearby needs your blood group
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              Turn on notifications and we&apos;ll alert you about urgent requests
              near you — even when this site is closed.
            </p>
          </div>
        </div>

        {error && <p className="text-xs font-medium text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button onClick={enable} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Yes, notify me
          </button>
          <button onClick={dismiss} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
            <X className="h-4 w-4" /> No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
