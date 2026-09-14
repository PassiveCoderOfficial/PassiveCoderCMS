"use client";

import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";

const DISMISS_KEY = "pc_printer_notice_dismissed";

/**
 * Surfaces the printer/device recommendation that was decided back in
 * Phase 5 (docs/business/06-restaurant-vertical.md) but never actually
 * shown to a customer anywhere — a real gap flagged in Phase 6 planning.
 * Small notification, not the printer bridge integration itself (that's a
 * separate, later piece of work — this just tells a restaurant tenant what
 * hardware to buy before they discover the hard way that POS/Kitchen
 * assumes a receipt printer exists).
 *
 * Shown on Branches (where restaurant setup starts) and POS (where the
 * absence of a printer is felt first) — dismissible per browser, same
 * pattern as ai-site-banner.tsx, not per-tenant server state since this is
 * a one-time "did you know" rather than something that needs to persist
 * across devices or reappear after being handled.
 */
export function PrinterNotice() {
  const [dismissed, setDismissed] = useState(true); // default hidden until localStorage check settles, avoids a flash

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* nothing to do */ }
  }

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-600/40 rounded-xl p-4">
      <Printer className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">You'll need a receipt printer for the kitchen/POS</p>
        <p className="text-xs text-gray-400 mt-1">
          We recommend the <span className="text-gray-300 font-medium">Sunmi V2 Pro</span> — an Android
          POS terminal with a built-in thermal printer, works out of the box with no separate install,
          available internationally including Bangladesh. Don't have one yet? No problem — orders still
          work fine on-screen only; the printer just saves a trip back to check the kitchen board.
        </p>
      </div>
      <button onClick={dismiss} className="text-gray-500 hover:text-white shrink-0" title="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
