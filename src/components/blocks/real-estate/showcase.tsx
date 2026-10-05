"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BedDouble, Maximize, MapPin } from "lucide-react";
import { priceLabel, areaLabel, bedsLabel, LISTING_TYPE_LABEL } from "@/lib/real-estate/format";
import type { ReCardProperty } from "./shared";

/**
 * Full-bleed property showcase: one listing at a time, auto-advancing.
 * Each slide cross-fades in while its photo slowly zooms (Ken Burns), a
 * giant outlined index number drifts behind the glass detail card, and the
 * text lines rise in one after another. Swipe, arrows and keyboard work;
 * auto-play pauses on hover and when the tab is hidden.
 */
export function PropertyShowcase({ items, currency, accent }: { items: ReCardProperty[]; currency?: string; accent?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // restarts the progress bar
  const touch = useRef<number | null>(null);
  const n = items.length;
  const go = useCallback((d: number) => { setI((v) => (v + d + n) % n); setTick((t) => t + 1); }, [n]);
  const ac = accent || "hsl(var(--primary))";

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => go(1), 6500);
    return () => clearTimeout(t);
  }, [i, paused, n, go, tick]);

  useEffect(() => {
    const vis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  if (!n) return null;

  return (
    <div
      className="relative h-[86vh] min-h-[560px] w-full overflow-hidden rounded-[28px] bg-black text-white select-none"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; }}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
      tabIndex={0} aria-roledescription="carousel"
    >
      <style>{`
        @keyframes sb-kb { from { transform: scale(1.18) translate3d(1.5%, 1%, 0) } to { transform: scale(1.02) translate3d(0,0,0) } }
        @keyframes sb-rise { from { opacity: 0; transform: translateY(36px); filter: blur(8px) } to { opacity: 1; transform: none; filter: none } }
        @keyframes sb-ghost { from { opacity: 0; transform: translateX(8%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes sb-bar { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      `}</style>

      {items.map((p, k) => {
        const on = k === i;
        return (
          <div key={p.id} aria-hidden={!on}
            className="absolute inset-0 transition-[opacity,clip-path] duration-[1400ms] ease-[cubic-bezier(.7,0,.2,1)]"
            style={{ opacity: on ? 1 : 0, clipPath: on ? "inset(0 0 0 0)" : "inset(0 0 0 12%)", zIndex: on ? 2 : 1 }}>
            {p.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt={p.title} className="absolute inset-0 h-full w-full object-cover"
                style={on ? { animation: "sb-kb 9s cubic-bezier(.2,.6,.2,1) both" } : undefined} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        );
      })}

      {/* Giant ghost number */}
      <div key={`g${i}`} className="pointer-events-none absolute -right-4 sm:right-6 top-1/2 -translate-y-1/2 z-[3] font-bold leading-none tracking-tighter"
        style={{ fontSize: "clamp(10rem, 34vw, 30rem)", color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,.28)", fontFamily: "var(--heading-font, inherit)", animation: "sb-ghost 1.6s cubic-bezier(.2,.7,.2,1) both" }}>
        {String(i + 1).padStart(2, "0")}
      </div>

      {/* Copy + glass card */}
      {(() => {
        const p = items[i];
        const place = [p.community?.name, p.city].filter(Boolean).join(", ");
        const d = (n: number) => ({ animation: `sb-rise 1s cubic-bezier(.2,.7,.2,1) ${n}ms both` });
        return (
          <div key={`c${i}`} className="absolute inset-0 z-[4] flex flex-col justify-end p-6 sm:p-12 lg:p-16">
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em]" style={{ ...d(150), color: ac }}>{LISTING_TYPE_LABEL[p.listing_type]}{place ? ` · ${place}` : ""}</p>
            <h3 className="mt-3 max-w-3xl text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05]" style={{ ...d(300), fontFamily: "var(--heading-font, inherit)" }}>{p.title}</h3>
            <div className="mt-6 sm:mt-8 inline-flex w-fit flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-xl" style={d(480)}>
              <span className="text-2xl sm:text-3xl font-semibold">{priceLabel(p, currency)}</span>
              {p.beds != null && <span className="flex items-center gap-1.5 text-white/85"><BedDouble className="h-4 w-4" />{bedsLabel(p.beds, p.beds_max)}</span>}
              {p.area != null && <span className="flex items-center gap-1.5 text-white/85"><Maximize className="h-4 w-4" />{areaLabel(p.area, p.area_unit)}</span>}
              {place && <span className="hidden sm:flex items-center gap-1.5 text-white/85"><MapPin className="h-4 w-4" />{place}</span>}
            </div>
            <a href={`/properties/${p.slug}`} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full px-7 h-12 font-semibold text-black transition-transform hover:scale-[1.03]"
              style={{ ...d(620), background: ac }}>
              View residence <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        );
      })()}

      {/* Controls */}
      {n > 1 && (
        <div className="absolute right-5 sm:right-12 bottom-6 sm:bottom-12 z-[5] flex items-center gap-4">
          <span className="text-sm tabular-nums text-white/80">{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
          <button type="button" aria-label="Previous" onClick={() => go(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/5 backdrop-blur hover:bg-white hover:text-black transition-colors"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Next" onClick={() => go(1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/5 backdrop-blur hover:bg-white hover:text-black transition-colors"><ArrowRight className="h-4 w-4" /></button>
        </div>
      )}
      {n > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-[5] h-[3px] bg-white/10">
          <div key={`${i}-${tick}`} className="h-full origin-left" style={{ background: ac, animation: paused ? "none" : "sb-bar 6.5s linear both" }} />
        </div>
      )}
    </div>
  );
}
