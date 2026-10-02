"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ScrollStoryBlockProps } from "@/types/cms";

/**
 * Scroll-driven cinematic hero. The section is several screens tall and pins
 * a full-screen stage; scrolling scrubs a timeline instead of moving the page:
 *  - background photos zoom slowly (Ken Burns) and cross-fade into each other
 *  - an optional cut-out portrait rises in and stays in front
 *  - headline "scenes" fade in from a blur, hold, then blur out, alternating sides
 *  - a progress bar fills and the bottom edge blends into the next section
 * Built from layered images (no video or frame sequence needed), so any site
 * can make one from a few photos. Only transform/opacity/filter are animated.
 */
export function ScrollStoryBlock({ block }: { block: ScrollStoryBlockProps }) {
  const { data } = block;
  const backgrounds = (data.backgrounds ?? []).filter((b) => b?.imageUrl);
  const scenes = (data.scenes ?? []).filter((s) => s?.title);
  const heightVh = Math.min(Math.max(data.heightVh ?? 500, 200), 900);
  const blend = data.blendColor || "hsl(var(--background))";
  const accent = data.accentColor || "#C8A96A";

  const sectionRef = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distance = el.offsetHeight - window.innerHeight;
      setP(distance > 0 ? Math.min(Math.max(-rect.top / distance, 0), 1) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const progress = reduced ? 0.12 : p;
  const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

  // Background i owns an equal slice of the timeline; neighbours overlap by a
  // short cross-fade so there is never a blank frame.
  const bgCount = Math.max(backgrounds.length, 1);
  const slice = 1 / bgCount;
  const fade = Math.min(0.08, slice / 2);
  const bgStyle = (i: number): React.CSSProperties => {
    const start = i * slice;
    const end = start + slice;
    let opacity = 1;
    if (i > 0) opacity = ease((progress - (start - fade)) / (fade * 2));
    if (i < bgCount - 1 && progress > end - fade) opacity = Math.min(opacity, 1 - ease((progress - (end - fade)) / (fade * 2)));
    const local = Math.min(Math.max((progress - start) / slice, 0), 1);
    const scale = 1.18 - 0.14 * local;
    return { opacity, transform: `scale(${scale})`, zIndex: i };
  };

  // Scenes share the 4%..92% stretch of the timeline.
  const sceneSpan = scenes.length ? 0.88 / scenes.length : 0;
  const sceneStyle = (i: number): React.CSSProperties => {
    if (reduced) return { opacity: i === 0 ? 1 : 0 };
    const start = 0.04 + i * sceneSpan;
    const inEnd = start + sceneSpan * 0.3;
    const outStart = start + sceneSpan * 0.72;
    const end = start + sceneSpan;
    const last = i === scenes.length - 1;
    let o = 0, y = 30, blur = 10;
    if (progress >= start && progress < inEnd) { const t = ease((progress - start) / (inEnd - start)); o = t; y = 30 * (1 - t); blur = 10 * (1 - t); }
    else if (progress >= inEnd && (progress < outStart || last)) { o = 1; y = 0; blur = 0; }
    else if (progress >= outStart && progress < end) { const t = (progress - outStart) / (end - outStart); o = 1 - t; y = -24 * t; blur = 6 * t; }
    return { opacity: o, transform: `translateY(${y}px)`, filter: blur ? `blur(${blur.toFixed(1)}px)` : "none" };
  };

  const portraitIn = reduced ? 1 : ease(progress / 0.14);
  const portraitScale = 0.92 + 0.08 * portraitIn + (reduced ? 0 : 0.04 * progress);
  const side = data.portraitSide ?? "center";
  const portraitPos = side === "left" ? "left-[4%] lg:left-[8%]" : side === "right" ? "right-[4%] lg:right-[8%]" : "left-1/2";
  const ctaVisible = progress > 0.86 || reduced;

  return (
    <section ref={sectionRef} className="relative w-full bg-black" style={{ height: `${reduced ? 100 : heightVh}vh` }}>
      <div className="sticky top-0 h-screen h-[100dvh] w-full overflow-hidden">
        {/* Background photos */}
        {backgrounds.length > 0 ? backgrounds.map((b, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={b.imageUrl} alt="" loading={i === 0 ? "eager" : "lazy"}
            className="absolute inset-0 w-full h-full object-cover will-change-transform" style={bgStyle(i)} />
        )) : <div className="absolute inset-0" style={{ background: "#111" }} />}

        {/* Readability overlay + top vignette for the nav */}
        <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: `rgba(0,0,0,${data.overlayOpacity ?? 0.45})` }} />
        <div className="absolute inset-x-0 top-0 h-40 z-20 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

        {/* Architectural line grid, drifting slightly with scroll */}
        {data.showLines !== false && (
          <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.14]"
            style={{
              backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
              backgroundSize: "120px 120px",
              transform: `translateY(${-progress * 120}px)`,
              maskImage: "radial-gradient(ellipse at center, #000 20%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, #000 20%, transparent 75%)",
            }} />
        )}

        {/* Portrait cut-out */}
        {data.portraitImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.portraitImage} alt={data.portraitAlt ?? ""}
            className={`absolute bottom-0 z-30 h-[58vh] sm:h-[74vh] lg:h-[82vh] w-auto max-w-none origin-bottom will-change-transform pointer-events-none ${portraitPos}`}
            style={{
              opacity: portraitIn,
              transform: `${side === "center" ? "translateX(-50%) " : ""}translateY(${(1 - portraitIn) * 18}%) scale(${portraitScale})`,
              filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))",
            }} />
        )}

        {/* Scenes */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          {scenes.map((s, i) => {
            const right = (s.side ?? (i % 2 ? "right" : "left")) === "right";
            return (
              <div key={i} style={sceneStyle(i)}
                className={`absolute inset-x-0 top-[96px] px-5 text-center sm:top-[16%] sm:px-0 sm:max-w-[min(440px,36vw)] will-change-transform ${right ? "sm:inset-x-auto sm:right-[5%] sm:text-right" : "sm:inset-x-auto sm:left-[5%] sm:text-left"}`}>
                {s.eyebrow && (
                  <p className="mb-3 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: accent }}>{s.eyebrow}</p>
                )}
                <h2 className="text-[2rem] sm:text-5xl lg:text-[64px] font-bold leading-[1.04] tracking-tight text-white"
                  style={{ textShadow: "0 6px 28px rgba(0,0,0,0.8)", fontFamily: "var(--heading-font, inherit)" }}>
                  {s.title}
                </h2>
                {s.text && <p className="mt-4 text-base sm:text-lg text-white/80">{s.text}</p>}
              </div>
            );
          })}
        </div>

        {/* Closing call to action */}
        {(data.primaryCta?.label || data.secondaryCta?.label) && (
          <div className="absolute inset-x-0 bottom-[12vh] z-50 flex justify-center gap-3 px-4 transition-all duration-500"
            style={{ opacity: ctaVisible ? 1 : 0, transform: `translateY(${ctaVisible ? 0 : 16}px)`, pointerEvents: ctaVisible ? "auto" : "none" }}>
            {data.primaryCta?.label && (
              <a href={data.primaryCta.url || "#"} className="h-12 px-7 rounded-full font-semibold inline-flex items-center text-black shadow-xl" style={{ background: accent }}>
                {data.primaryCta.label}
              </a>
            )}
            {data.secondaryCta?.label && (
              <a href={data.secondaryCta.url || "#"} className="h-12 px-7 rounded-full font-semibold inline-flex items-center text-white border border-white/40 bg-white/10 backdrop-blur">
                {data.secondaryCta.label}
              </a>
            )}
          </div>
        )}

        {/* Scroll hint, progress bar, bottom blend */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 text-[11px] uppercase tracking-[0.3em] text-white/70 transition-opacity"
          style={{ opacity: progress < 0.04 && !reduced ? 1 : 0 }}>Scroll</div>
        <div className="absolute bottom-0 inset-x-0 h-28 sm:h-40 z-[45] pointer-events-none"
          style={{ background: `linear-gradient(to top, ${blend}, transparent)`, opacity: ease((progress - 0.8) / 0.2) }} />
        {!reduced && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] z-50 bg-white/10">
            <div className="h-full origin-left" style={{ background: accent, transform: `scaleX(${progress})` }} />
          </div>
        )}
      </div>
    </section>
  );
}
