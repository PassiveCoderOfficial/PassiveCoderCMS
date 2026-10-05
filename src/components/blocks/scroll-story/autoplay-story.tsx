"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ScrollStoryBlockProps } from "@/types/cms";

/**
 * Single-screen "film" hero: background photos play like footage (slow
 * zoom-and-pan, long cross-dissolves), headlines change on their own beat,
 * a cut-out portrait floats in front, and film grain plus a drifting light
 * sweep give it a shot-on-camera feel. Scrolling away adds depth: the
 * backdrop sinks, the portrait rises and the copy fades.
 */
export function AutoplayStory({ data, RotatingTitle }: {
  data: ScrollStoryBlockProps["data"];
  RotatingTitle: (p: { title: string; words: string[]; color: string }) => React.ReactNode;
}) {
  const bgs = (data.backgrounds ?? []).filter((b) => b?.imageUrl);
  const scenes = (data.scenes ?? []).filter((s) => s?.title);
  const accent = data.accentColor || "#C8A96A";
  const blend = data.blendColor || "hsl(var(--background))";
  const shot = Math.max(data.slideMs ?? 6500, 3000);

  const [n, setN] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [leave, setLeave] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const t0 = setTimeout(() => setLoaded(true), 60);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => clearTimeout(t0);
    const t = setInterval(() => setN((v) => v + 1), shot);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [shot]);

  useEffect(() => {
    let raf = 0;
    const upd = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const h = el.offsetHeight || 1;
      setLeave(Math.min(Math.max(window.scrollY / h, 0), 1));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(upd); };
    upd();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const bi = bgs.length ? n % bgs.length : 0;
  const si = scenes.length ? n % scenes.length : 0;
  const s = scenes[si];
  const right = s ? (s.side ?? (si % 2 ? "right" : "left")) === "right" : false;
  const pans = ["translate(-2%,-1%)", "translate(2%,1%)", "translate(-1.5%,1.5%)", "translate(1.5%,-1.5%)"];

  return (
    <section ref={ref} data-no-motion className="relative isolate h-[100svh] min-h-[560px] w-full overflow-hidden bg-black text-white">
      <style>{`
        @keyframes as-kb { from { transform: scale(1.22) var(--pan) } to { transform: scale(1.04) translate(0,0) } }
        @keyframes as-rise { from { opacity:0; transform: translateY(40px); filter: blur(12px) } to { opacity:1; transform:none; filter:none } }
        @keyframes as-line { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes as-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -10px } }
        @keyframes as-sweep { 0% { transform: translateX(-60%) rotate(12deg) } 100% { transform: translateX(160%) rotate(12deg) } }
        @keyframes as-grain { 0%{transform:translate(0,0)} 25%{transform:translate(-3%,2%)} 50%{transform:translate(2%,-3%)} 75%{transform:translate(-2%,-2%)} 100%{transform:translate(0,0)} }
        @keyframes as-up { from { opacity:0; transform: translateY(18%) scale(.96) } to { opacity:1; transform:none } }
      `}</style>

      {/* Footage */}
      <div className="absolute inset-0" style={{ transform: `translateY(${leave * 18}%) scale(${1 + leave * 0.08})` }}>
        {bgs.map((b, k) => (
          <div key={k} className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out" style={{ opacity: k === bi ? 1 : 0, zIndex: k === bi ? 2 : 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imageUrl} alt="" loading={k < 2 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover"
              key={k === bi ? `on-${n}` : `off-${k}`}
              style={{ ["--pan" as string]: pans[k % pans.length], animation: k === bi ? `as-kb ${shot + 1800}ms linear both` : undefined }} />
          </div>
        ))}
      </div>

      {/* Grade: vignette, readability gradient, light sweep, grain */}
      <div className="pointer-events-none absolute inset-0 z-[3]" style={{ background: `radial-gradient(120% 90% at 50% 40%, transparent 35%, rgba(0,0,0,.55) 100%), linear-gradient(${right ? "to left" : "to right"}, rgba(0,0,0,${data.overlayOpacity ?? 0.55}), rgba(0,0,0,.05) 65%)` }} />
      <div className="pointer-events-none absolute -inset-y-1/2 left-0 z-[3] w-1/3 opacity-[.13] mix-blend-screen" style={{ background: "linear-gradient(90deg, transparent, #fff, transparent)", animation: "as-sweep 9s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute -inset-[10%] z-[3] opacity-[.09] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")", animation: "as-grain .9s steps(4) infinite" }} />

      {/* Portrait */}
      {data.portraitImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.portraitImage} alt={data.portraitAlt ?? ""}
          className={`absolute bottom-0 z-[4] h-[50vh] sm:h-[78vh] lg:h-[86vh] w-auto max-w-none pointer-events-none ${right ? "left-[2%] sm:left-[8%]" : "right-[-14%] sm:right-[6%]"}`}
          style={{
            opacity: loaded ? 1 : 0,
            animation: loaded ? "as-up 1.6s cubic-bezier(.2,.7,.2,1) both, as-float 7s ease-in-out 1.6s infinite" : undefined,
            transform: `translateY(${-leave * 12}%)`,
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,.6))",
          }} />
      )}

      {/* Copy */}
      {s && (
        <div className={`absolute inset-0 z-[5] flex flex-col justify-start pt-24 sm:pt-0 sm:justify-center px-6 sm:px-[7%] ${right ? "sm:items-end sm:text-right" : ""}`}
          style={{ opacity: 1 - leave * 1.4, transform: `translateY(${-leave * 60}px)` }}>
          <div key={`s${n}`} className="max-w-[min(620px,90vw)]">
            {s.eyebrow && (
              <div className={`flex items-center gap-3 ${right ? "sm:justify-end" : ""}`} style={{ animation: "as-rise .9s cubic-bezier(.2,.7,.2,1) both" }}>
                <span className="h-px w-10 origin-left" style={{ background: accent, animation: "as-line 1s cubic-bezier(.7,0,.2,1) .1s both" }} />
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: accent }}>{s.eyebrow}</span>
              </div>
            )}
            <h1 className="mt-4 text-[2.1rem] sm:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-tight"
              style={{ fontFamily: "var(--heading-font, inherit)", textShadow: "0 8px 40px rgba(0,0,0,.6)", animation: "as-rise 1.2s cubic-bezier(.2,.7,.2,1) .15s both" }}>
              {s.rotateWords?.length ? <RotatingTitle title={s.title} words={s.rotateWords} color={accent} /> : s.title}
            </h1>
            {s.text && <p className="mt-5 text-base sm:text-lg text-white/80" style={{ animation: "as-rise 1.1s cubic-bezier(.2,.7,.2,1) .35s both" }}>{s.text}</p>}
          </div>
          {(data.primaryCta?.label || data.secondaryCta?.label) && (
            <div className={`mt-8 flex flex-wrap gap-3 ${right ? "sm:justify-end" : ""}`} style={{ animation: loaded ? "as-rise 1.2s cubic-bezier(.2,.7,.2,1) .6s both" : undefined, opacity: loaded ? undefined : 0 }}>
              {data.primaryCta?.label && (
                <a href={data.primaryCta.url || "#"} className="h-12 px-7 rounded-full inline-flex items-center font-semibold text-black shadow-xl transition-transform hover:scale-[1.04]" style={{ background: accent }}>{data.primaryCta.label}</a>
              )}
              {data.secondaryCta?.label && (
                <a href={data.secondaryCta.url || "#"} className="h-12 px-7 rounded-full inline-flex items-center font-semibold border-2 bg-black/30 backdrop-blur transition-transform hover:scale-[1.04]" style={{ borderColor: accent, color: accent }}>{data.secondaryCta.label}</a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Shot indicator + scroll cue + blend */}
      {bgs.length > 1 && (
        <div className="absolute bottom-6 left-6 sm:left-[7%] z-[6] flex items-center gap-2">
          {bgs.map((_, k) => (
            <button key={k} type="button" aria-label={`Show image ${k + 1}`} onClick={() => setN(k + Math.floor(n / bgs.length) * bgs.length)}
              className="relative h-[3px] w-8 sm:w-12 overflow-hidden rounded-full bg-white/25">
              {k === bi && <span key={n} className="absolute inset-0 origin-left" style={{ background: accent, animation: `as-line ${shot}ms linear both` }} />}
            </button>
          ))}
        </div>
      )}
      <div className="absolute bottom-6 right-6 sm:right-[7%] z-[6] hidden sm:flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/70" style={{ opacity: 1 - leave * 3 }}>
        Scroll
        <span className="h-10 w-px overflow-hidden bg-white/20"><span className="block h-1/2 w-px bg-white" style={{ animation: "as-float 1.6s ease-in-out infinite" }} /></span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-24" style={{ background: `linear-gradient(to top, ${blend}, transparent)`, opacity: 0.35 + leave }} />
    </section>
  );
}
