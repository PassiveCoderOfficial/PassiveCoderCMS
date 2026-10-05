"use client";

import React, { useEffect, useRef } from "react";
import type { MarqueeBlockProps } from "@/types/cms";

/**
 * Endless band of large words (cities, services, values). It drifts on its
 * own and speeds up with scroll velocity, briefly reversing when the visitor
 * scrolls up. Alternate words can be outlined for a luxury, editorial look.
 */
export function MarqueeBlock({ block }: { block: MarqueeBlockProps }) {
  const { data } = block;
  const words = (data.items ?? []).filter(Boolean);
  const track = useRef<HTMLDivElement>(null);
  const speed = data.speed ?? 40; // px per second
  const dir = data.direction === "right" ? 1 : -1;

  useEffect(() => {
    const el = track.current;
    if (!el || !words.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = 0, last = performance.now(), boost = 0, lastY = window.scrollY, raf = 0;
    const onScroll = () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      boost = Math.max(-1200, Math.min(1200, boost + dy * 6));
    };
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      boost *= 0.92;
      const v = dir * speed + (data.scrollBoost === false ? 0 : -Math.abs(boost) * (boost < 0 ? -1 : 1) * 0.15 * -dir);
      x += v * dt;
      const half = el.scrollWidth / 2;
      if (half > 0) { if (x <= -half) x += half; if (x > 0) x -= half; }
      el.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, [words.length, speed, dir, data.scrollBoost]);

  if (!words.length) return null;
  const size = { sm: "text-3xl sm:text-5xl", md: "text-5xl sm:text-7xl", lg: "text-6xl sm:text-8xl lg:text-9xl" }[data.size ?? "lg"];
  const sep = data.separator ?? "✦";
  const color = data.color || "currentColor";
  const run = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className={`${size} whitespace-nowrap px-6 sm:px-10 font-semibold tracking-tight leading-none`}
            style={data.outlineAlternate !== false && i % 2 === 1
              ? { color: "transparent", WebkitTextStroke: `1.5px ${color}`, fontFamily: "var(--heading-font, inherit)" }
              : { color, fontFamily: "var(--heading-font, inherit)" }}>
            {w}
          </span>
          <span className="text-2xl sm:text-4xl opacity-60" style={{ color: data.accentColor || color }}>{sep}</span>
        </React.Fragment>
      ))}
    </div>
  );
  return (
    <section className="relative overflow-hidden py-2" data-no-motion aria-label={words.join(", ")}>
      <div ref={track} className="flex w-max will-change-transform">{run("a")}{run("b")}</div>
    </section>
  );
}
