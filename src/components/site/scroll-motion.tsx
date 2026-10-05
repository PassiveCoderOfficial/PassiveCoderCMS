"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Site-wide "cinematic" motion, switched on per site with
 * design_overrides.motion = "cinematic" (surfaced to the page as the
 * --pc-motion CSS variable by the theme CSS, so no extra query is needed).
 *
 * Every layer of a section gets its own entrance, so a section assembles
 * itself rather than just fading in:
 *  - coloured sections open from an inset, rounded frame to full bleed
 *  - big headings rise from behind a mask; other text rises out of a blur
 *  - cards lift and settle in a staggered cascade
 *  - divided rows (FAQ items, pillars, footer bars) slide in one by one
 *  - icons pop in with a soft spring
 *  - photos wipe open, zoom out inside their frame and drift (parallax)
 *  - form fields rise in sequence
 * Everything replays when scrolled back to, in both directions, plus
 * inertial smooth scrolling on mouse/trackpad devices.
 *
 * Header/nav and anything marked data-no-motion are left alone;
 * prefers-reduced-motion turns it all off.
 */
const E = "cubic-bezier(.2,.7,.2,1)";
const CSS = `
.pcm-t{opacity:0;translate:0 28px;filter:blur(6px);transition:opacity .9s ${E},translate .9s ${E},filter .9s ease;transition-delay:var(--pcm-d,0ms)}
.pcm-h{clip-path:inset(0 0 100% 0);translate:0 .6em;transition:clip-path 1.1s cubic-bezier(.7,0,.2,1),translate 1.1s ${E};transition-delay:var(--pcm-d,0ms)}
.pcm-h.pcm-in{clip-path:inset(-0.2em -0.2em -0.3em -0.2em);translate:0 0}
.pcm-i{clip-path:inset(18% 0 0 0 round 24px);opacity:.001;transition:clip-path 1.25s cubic-bezier(.2,.75,.15,1),opacity .8s ease;transition-delay:var(--pcm-d,0ms)}
.pcm-i.pcm-in{clip-path:inset(0 0 0 0 round 0px);opacity:1}
.pcm-i img{will-change:translate,scale;scale:1.32;transition:scale 1.9s ${E}}
.pcm-i.pcm-in img{scale:1.14}
.pcm-s{clip-path:inset(5% 3% 5% 3% round 48px);transition:clip-path 1.4s cubic-bezier(.65,0,.15,1)}
.pcm-s.pcm-in{clip-path:inset(0 0 0 0 round 0px)}
.pcm-c{opacity:0;translate:0 64px;scale:.94;filter:blur(4px);transition:opacity 1s ${E},translate 1.15s ${E},scale 1.15s ${E},filter 1s ease;transition-delay:var(--pcm-d,0ms)}
.pcm-r{opacity:0;translate:-48px 0;clip-path:inset(0 70% 0 0);transition:opacity .9s ${E},translate 1s ${E},clip-path 1.1s cubic-bezier(.65,0,.15,1);transition-delay:var(--pcm-d,0ms)}
.pcm-r.pcm-in{clip-path:inset(0 0 0 0)}
.pcm-ic{opacity:0;scale:.3;rotate:-25deg;transition:opacity .6s ease,scale .9s cubic-bezier(.34,1.56,.64,1),rotate .9s cubic-bezier(.34,1.56,.64,1);transition-delay:calc(var(--pcm-d,0ms) + 220ms)}
.pcm-f{opacity:0;translate:0 22px;transition:opacity .7s ${E},translate .8s ${E};transition-delay:var(--pcm-d,0ms)}
.pcm-t.pcm-in,.pcm-c.pcm-in,.pcm-r.pcm-in,.pcm-ic.pcm-in,.pcm-f.pcm-in{opacity:1;translate:0 0;scale:1;rotate:0deg;filter:none}
html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}
`;

const HEAD = "h1,h2";
const TEXT = "h3,h4,h5,p,li,blockquote,a.rounded-full,button.rounded-full,[class*='uppercase'][class*='tracking']";
const FIELDS = "input:not([type=hidden]),select,textarea,form button";

const transparent = (c: string) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);

export function ScrollMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const motion = getComputedStyle(document.documentElement).getPropertyValue("--pc-motion").trim();
    if (motion !== "cinematic") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!document.getElementById("pcm-style")) {
      const st = document.createElement("style");
      st.id = "pcm-style";
      document.head.appendChild(st);
    }
    document.getElementById("pcm-style")!.textContent = CSS;

    const excluded = (el: Element) =>
      !!el.closest("[data-site-chrome='header'], nav, header, [data-no-motion], .pcm-skip, [role='dialog']");

    const seen = new WeakSet<Element>();
    const proxied = new Map<HTMLElement, HTMLElement[]>();
    const parallax = new Set<HTMLImageElement>();
    const ANIM = ["pcm-t", "pcm-i", "pcm-s", "pcm-c", "pcm-r", "pcm-ic", "pcm-f"];

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        // Zero-area elements (masked headings) are watched through their
        // parent; the class goes to them as well as the parent itself.
        const own = ANIM.some((c) => el.classList.contains(c));
        const targets = proxied.has(el) ? [...proxied.get(el)!, ...(own ? [el] : [])] : [el];
        if (e.isIntersecting) targets.forEach((t) => t.classList.add("pcm-in"));
        else if (e.boundingClientRect.top > window.innerHeight || e.boundingClientRect.bottom < 0) targets.forEach((t) => t.classList.remove("pcm-in"));
      }
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

    const mark = (el: Element, cls: string, delay = 0) => {
      el.classList.add(cls);
      (el as HTMLElement).style.setProperty("--pcm-d", `${delay}ms`);
      io.observe(el);
    };
    const siblingIndex = (el: Element) => (el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0);
    const animatedAncestor = (el: Element, cls: string[]) => !!el.parentElement?.closest(cls.map((c) => "." + c).join(","));

    const scanBlock = (block: HTMLElement) => {
      // 1. Coloured sections open from a framed inset to full bleed.
      if (!seen.has(block)) {
        seen.add(block);
        const cs = getComputedStyle(block);
        if (block.dataset.pcBlock !== "footer" && (!transparent(cs.backgroundColor) || cs.backgroundImage !== "none")) mark(block, "pcm-s");
      }

      // 2. Masked headings.
      let i = 0;
      block.querySelectorAll<HTMLElement>(HEAD).forEach((el) => {
        if (seen.has(el) || excluded(el)) return;
        seen.add(el);
        if (el.closest(".pcm-i")) return;
        el.classList.add("pcm-h");
        el.style.setProperty("--pcm-d", `${Math.min(i++, 3) * 90}ms`);
        const host = el.parentElement ?? el;
        const list = proxied.get(host);
        if (list) list.push(el); else { proxied.set(host, [el]); io.observe(host); }
      });

      // 3. Photos.
      let j = 0;
      block.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        if (seen.has(img) || excluded(img)) return;
        if (img.width < 120 || img.naturalWidth === 1) return;
        seen.add(img);
        const frame = (img.closest(".overflow-hidden") as HTMLElement | null) ?? img;
        if (!block.contains(frame) || frame.classList.contains("pcm-i")) return;
        mark(frame, "pcm-i", Math.min(j++, 4) * 90);
        if (frame !== img) parallax.add(img);
      });

      // 4. Cards and rows (one style check per element, cached via `seen`).
      block.querySelectorAll<HTMLElement>("div, article, li, a, details, form").forEach((el) => {
        if (seen.has(el) || excluded(el)) return;
        seen.add(el);
        if (el.classList.contains("pcm-i") || animatedAncestor(el, ["pcm-c", "pcm-i", "pcm-r"])) return;
        if (el.offsetHeight < 56 || el.offsetWidth < 120) return;
        const cs = getComputedStyle(el);
        if (cs.position === "absolute" || cs.position === "fixed") return;
        const radius = parseFloat(cs.borderTopLeftRadius) || 0;
        const filled = !transparent(cs.backgroundColor) || cs.boxShadow !== "none" || parseFloat(cs.borderTopWidth) > 0;
        if (radius >= 10 && filled && el.offsetHeight >= 80) { mark(el, "pcm-c", Math.min(siblingIndex(el), 6) * 110); return; }
        const ruled = (parseFloat(cs.borderBottomWidth) > 0 || parseFloat(cs.borderTopWidth) > 0) && radius < 4;
        const wide = el.parentElement ? el.offsetWidth >= el.parentElement.offsetWidth * 0.55 : false;
        if (ruled && wide && el.offsetHeight < 260) mark(el, "pcm-r", Math.min(siblingIndex(el), 8) * 80);
      });

      // 5. Text (skipping what already moves with a heading/row/photo).
      let k = 0;
      block.querySelectorAll<HTMLElement>(TEXT).forEach((el) => {
        if (seen.has(el) || excluded(el)) return;
        seen.add(el);
        if (animatedAncestor(el, ["pcm-t", "pcm-h", "pcm-i", "pcm-r"]) || el.closest(".pcm-i")) return;
        mark(el, "pcm-t", Math.min(k++, 6) * 70);
      });

      // 6. Icons pop; form fields rise in order.
      block.querySelectorAll<SVGElement>("svg").forEach((svg) => {
        if (seen.has(svg) || excluded(svg)) return;
        seen.add(svg);
        const r = svg.getBoundingClientRect();
        if (r.width < 14 || r.width > 80 || svg.closest("button, a.rounded-full, .pcm-t, .pcm-h")) return;
        mark(svg, "pcm-ic");
      });
      let m = 0;
      block.querySelectorAll<HTMLElement>(FIELDS).forEach((el) => {
        if (seen.has(el) || excluded(el)) return;
        seen.add(el);
        mark(el, "pcm-f", Math.min(m++, 8) * 70);
      });
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-pc-block]").forEach((b) => {
        if (!excluded(b)) scanBlock(b);
      });
    };

    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      parallax.forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
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
    // Blocks that fetch data render later; rescans are debounced and cheap
    // because every element is only ever examined once.
    let pending: ReturnType<typeof setTimeout> | null = null;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = setTimeout(() => { pending = null; scan(); onScroll(); }, 250);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      mo.disconnect();
      if (pending) clearTimeout(pending);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (lraf) cancelAnimationFrame(lraf);
      lenis?.destroy();
    };
  }, [pathname]);

  return null;
}
