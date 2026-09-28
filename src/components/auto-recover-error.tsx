"use client";

import { useEffect, useState } from "react";

const KEY = "pc-auto-recover-at";
const WINDOW_MS = 20_000;

/**
 * Error screen that heals itself once. The dashboard error seen right after
 * login ("This page couldn't load", Next's bare default) always went away
 * on a manual reload — a transient failure on the first request, not a
 * broken page. So the first error in a 20s window reloads the page
 * automatically; only if it fails again straight after do we show a message.
 * sessionStorage keeps this to one automatic retry, never a reload loop.
 */
export function AutoRecoverError({ error, reset }: { error: Error & { digest?: string }; reset?: () => void }) {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    console.error("[auto-recover]", error);
    let last = 0;
    try { last = Number(sessionStorage.getItem(KEY) ?? 0); } catch {}
    if (Date.now() - last > WINDOW_MS) {
      try { sessionStorage.setItem(KEY, String(Date.now())); } catch {}
      window.location.reload();
      return;
    }
    setShowMessage(true);
  }, [error]);

  if (!showMessage) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#64748b", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Something went wrong loading this page</h1>
        <p style={{ color: "#64748b", marginTop: 10 }}>Please try again. If it keeps happening, contact support and mention the time it happened.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
          <button
            type="button"
            onClick={() => { try { sessionStorage.removeItem(KEY); } catch {} if (reset) reset(); window.location.reload(); }}
            style={{ background: "#111827", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
          <button type="button" onClick={() => history.back()} style={{ background: "transparent", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>
            Back
          </button>
        </div>
        {error.digest && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 16 }}>Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
