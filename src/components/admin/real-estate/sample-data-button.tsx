"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export function SampleDataButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/real-estate/seed", { method: "POST" });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setBusy(false); return; }
    window.location.reload();
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl px-5 py-4">
      <div>
        <p className="text-sm font-medium text-white">Starting fresh?</p>
        <p className="text-xs text-gray-400">Load 12 sample listings, 6 area guides and 5 developers to see the site working, then replace them with real inventory.</p>
      </div>
      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-red-400">{error}</span>}
        <button onClick={load} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Load sample listings
        </button>
      </div>
    </div>
  );
}
