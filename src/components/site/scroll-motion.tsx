"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Site-wide "cinematic" scroll motion, switched on per site with
 * design_overrides.motion = "cinematic" (surfaced to the page as the
 * --pc-motion CSS variable by the theme CSS, so no extra query is needed).
 *
 *  - Section text (headings, paragraphs, buttons) fades and rises in with a
 *    short stagger.
 *  - Photos wipe open from the bottom and settle from a slight zoom.
 *  - Photos drift with a gentle parallax while on screen.
 *
 * Reveals replay in both directions: an element that leaves the viewport is
 * reset, so scrolling back up animates it again (that is what makes the page
 * feel alive on a phone). Header, footer and elements marked
 * data-no-motion are left alone; prefers-reduced-motion turns it all off.
 */
const CSS = `
.pcm-t{opacity:0;translate:0 28px;filter:blur(6px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),translate .9s cubic-bezier(.2,.7,.2,1),filter .9s ease;transition-delay:var(--pcm-d,0ms)}
.pcm-t.pcm-in{opacity:1;translate:0 0;filter:none}
.pcm-i{clip-path:inset(18% 0 0 0 round 24px);opacity:.001;transition:clip-path 1.25s cubic-bezier(.2,.75,.15,1),opacity .8s ease;transition-delay:var(--pcm-d,0ms)}
.pcm-i.pcm-in{clip-path:inset(0 0 0 0 round 0px);opacity:1}
.pcm-i img{will-change:translate,scale;scale:1.32;transition:scale 1.9s cubic-bezier(.2,.7,.2,1)}
.pcm-i.pcm-in img{scale:1.14}
.pcm-h{clip-path:inset(0 0 100% 0);translate:0 .6em;transition:clip-path 1.1s cubic-bezier(.7,0,.2,1),translate 1.1s cubic-bezier(.2,.7,.2,1);transition-delay:var(--pcm-d,0ms)}
.pcm-h.pcm-in{clip-path:inset(-0.2em -0.2em -0.3em -0.2em);translate:0 0}
html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}
`;

const HEAD = "h1,h2";
const TEXT = "h3,h4,p,li,a.rounded-full,button.rounded-full,[class*='uppercase'][class*='tracking']";

export function ScrollMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const motion = getComputedStyle(document.documentElement).getPropertyValue("--pc-motion").trim();
    if (motion !== "cinematic") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!document.getElementById("pcm-style")) {
      const st = document.createElement("style");
      st.id = "pcm-style";
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    const excluded = (el: Element) =>
      !!el.closest("[data-site-chrome], nav, header, footer, [data-no-motion], .pcm-skip, [role='dialog']");

    const tracked = new Set<HTMLElement>();
    const proxied = new Map<HTMLElement, HTMLElement[]>();
    const parallax = new Set<HTMLImageElement>();

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        // A masked heading has zero visible area, so its parent is observed
        // as a proxy and the class is applied to the heading(s) it carries.
        const own = el.classList.contains("pcm-t") || el.classList.contains("pcm-i");
        const targets = proxied.has(el) ? [...proxied.get(el)!, ...(own ? [el] : [])] : [el];
        if (e.isIntersecting) targets.forEach((t) => t.classList.add("pcm-in"));
        // Reset once fully out of view so it replays when scrolled back to.
        else if (e.boundingClientRect.top > window.innerHeight || e.boundingClientRect.bottom < 0) targets.forEach((t) => t.classList.remove("pcm-in"));
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    const scan = () => {
      const sections = document.querySelectorAll<HTMLElement>("main section, body > div section, [data-block-id]");
      sections.forEach((sec) => {
        if (excluded(sec)) return;
        let i = 0;
        sec.querySelectorAll<HTMLElement>(HEAD).forEach((el) => {
          if (tracked.has(el) || excluded(el) || el.closest(".pcm-i")) return;
          el.classList.add("pcm-h");
          el.style.setProperty("--pcm-d", `${Math.min(i++, 3) * 90}ms`);
          tracked.add(el);
          const host = el.parentElement ?? el;
          const list = proxied.get(host);
          if (list) list.push(el); else { proxied.set(host, [el]); io.observe(host); }
        });
        sec.querySelectorAll<HTMLElement>(TEXT).forEach((el) => {
          if (tracked.has(el) || excluded(el)) return;
          // Skip text nested inside another animated text element.
          if (el.parentElement?.closest(".pcm-t, .pcm-h")) return;
          if (el.closest(".pcm-i")) return;
          el.classList.add("pcm-t");
          el.style.setProperty("--pcm-d", `${Math.min(i++, 6) * 70}ms`);
          tracked.add(el);
          io.observe(el);
        });
        let j = 0;
        sec.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
          if (excluded(img) || img.width < 120 || img.naturalWidth === 1) return;
          // Animate the image's clipping frame when it has one, else the image.
          const frame = (img.closest(".overflow-hidden") as HTMLElement | null) ?? img;
          if (!sec.contains(frame) || tracked.has(frame)) return;
          frame.classList.add("pcm-i");
          frame.style.setProperty("--pcm-d", `${Math.min(j++, 4) * 90}ms`);
          tracked.add(frame);
          io.observe(frame);
          if (frame !== img) parallax.add(img);
        });
      });
    };

    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      parallax.forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        // -1 (entering from below) .. 1 (leaving at the top)
        const t = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
        img.style.translate = `0 ${(t * -7).toFixed(2)}%`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // Inertial smooth scrolling on mouse/trackpad devices; touch keeps native.
    let lenis: Lenis | null = null;
    let lraf = 0;
    if (window.matchMedia("(pointer: fine)").matches) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
      const loop = (t: number) => { lenis?.raf(t); lraf = requestAnimationFrame(loop); };
      lraf = requestAnimationFrame(loop);
    }

    scan();
    tick();
    // Blocks that fetch their data (listings, areas) render after mount.
    const mo = new MutationObserver(() => { scan(); onScroll(); });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (lraf) cancelAnimationFrame(lraf);
      lenis?.destroy();
    };
  }, [pathname]);

  return null;
}
