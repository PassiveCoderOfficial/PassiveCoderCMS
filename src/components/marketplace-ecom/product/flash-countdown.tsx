"use client";

import { useEffect, useState } from "react";

/** HH:MM:SS countdown to a timestamp. Renders dashes until mounted so the
 *  server and client HTML agree. */
export function FlashCountdown({ endsAt, dark = false }: { endsAt: string; dark?: boolean }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const tick = () => setMs(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const s = ms === null ? 0 : Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const parts = [Math.floor((s % 86400) / 3600) + d * 24, Math.floor((s % 3600) / 60), s % 60].map((v) =>
    String(v).padStart(2, "0"),
  );
  return (
    <span className="flex items-center gap-1" aria-label="Time left">
      {parts.map((p, k) => (
        <span key={k} className="flex items-center gap-1">
          <span className={`${dark ? "bg-[#1A1330] text-white" : "bg-white text-[#FF5A1F]"} text-xs font-bold tabular-nums min-w-6 h-6 px-1 rounded flex items-center justify-center`}>
            {ms === null ? "--" : p}
          </span>
          {k < 2 && <span className="font-bold text-xs">:</span>}
        </span>
      ))}
    </span>
  );
}
