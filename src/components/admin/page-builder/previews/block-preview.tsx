"use client";

import React, { memo, startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Block } from "@/types/cms";
import { PreviewContent } from "./preview-content";
import { InlineEditContext } from "@/components/blocks/inline-text";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { usePreviewSiteContact } from "./preview-site-contact";
import { cn } from "@/lib/utils";

/**
 * A live, scaled-down render of a block: the canvas's own BlockRenderer, in
 * the site's theme (the builder's `.cms-canvas-light` palette), drawn at a
 * desktop page width and shrunk with a CSS transform. Used by the Layout
 * picker and the section and block pickers, so what they show is what the
 * block draws, by construction.
 *
 * Kept quiet so a grid of them stays cheap and side-effect free:
 * - rendered into a detached node first, so an embed (YouTube, Maps) gets a
 *   placeholder `srcdoc` and a video loses autoplay before it is ever in the
 *   document, and images reuse a size the page already loaded;
 * - CSS animations and transitions are cut to their end state;
 * - `inert` + aria-hidden: nothing inside can be focused, clicked or read
 *   out (the picker's button carries the name);
 * - no inline-editing context, so text renders as plain markup.
 */

/** Page width previews are drawn at. Tailwind md:/lg: follow the browser
 *  window, not this box, so on narrow windows the window's own width is used
 *  and the breakpoints agree with what is drawn. */
function pageWidth(): number {
  if (typeof window === "undefined") return 1280;
  const w = window.innerWidth;
  return w >= 1024 ? 1280 : Math.max(360, w);
}

/* ── Quieting the rendered DOM ─────────────────────────────────────────── */

const PLAYER_DOC = `<!doctype html><html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0f0f"><svg width="68" height="48" viewBox="0 0 68 48"><rect width="68" height="48" rx="12" fill="#ffffff" fill-opacity=".18"/><path d="M27 15v18l16-9z" fill="#fff"/></svg></body></html>`;
const MAP_DOC = `<!doctype html><html><body style="margin:0;height:100vh;background:#e8eaed;background-image:linear-gradient(#d5d8dc 2px,transparent 2px),linear-gradient(90deg,#d5d8dc 2px,transparent 2px);background-size:56px 56px;display:flex;align-items:center;justify-content:center"><svg width="34" height="46" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 32 12 32s12-11.5 12-20.3C24 5.2 18.6 0 12 0z" fill="#ea4335"/><circle cx="12" cy="11.5" r="4.5" fill="#fff"/></svg></body></html>`;
const EMBED_DOC = `<!doctype html><html><body style="margin:0;height:100vh;background:#f1f5f9"></body></html>`;

/** Base identity of an image URL: the same photo at any resize width. */
function imageBase(raw: string): string | null {
  try {
    const u = new URL(raw, window.location.href);
    if (u.pathname === "/_next/image") {
      const inner = u.searchParams.get("url");
      return inner ? imageBase(inner) : null;
    }
    if (u.hostname === "images.unsplash.com" || u.hostname === "images.pexels.com") return u.origin + u.pathname;
    return u.href;
  } catch {
    return null;
  }
}

/** Images the page has already downloaded, by base identity (largest kept). */
function loadedImages(): Map<string, { url: string; w: number }> {
  const out = new Map<string, { url: string; w: number }>();
  if (typeof performance === "undefined" || !performance.getEntriesByType) return out;
  for (const e of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
    if (e.initiatorType !== "img" && e.initiatorType !== "css" && e.initiatorType !== "link") continue;
    const base = imageBase(e.name);
    if (!base) continue;
    let w = 0;
    try { w = Number(new URL(e.name).searchParams.get("w")) || 0; } catch { /* keep 0 */ }
    const prev = out.get(base);
    if (!prev || w > prev.w) out.set(base, { url: e.name, w });
  }
  return out;
}

function quiet(root: HTMLElement, displayWidth: number) {
  root.querySelectorAll("iframe").forEach((f) => {
    if (f.hasAttribute("srcdoc")) return;
    const src = f.getAttribute("src") ?? "";
    // srcdoc wins over src, even if React later updates src.
    f.setAttribute("srcdoc", /maps|openstreetmap/i.test(src) ? MAP_DOC : /youtube|youtu\.be|vimeo|video/i.test(src) ? PLAYER_DOC : EMBED_DOC);
  });
  root.querySelectorAll<HTMLMediaElement>("video, audio").forEach((m) => {
    m.autoplay = false;
    m.removeAttribute("autoplay");
    m.preload = "none";
  });
  const imgs = root.querySelectorAll<HTMLImageElement>("img[srcset]:not([data-pc-q])");
  if (!imgs.length) return;
  const have = loadedImages();
  imgs.forEach((img) => {
    img.setAttribute("data-pc-q", "");
    const base = imageBase(img.getAttribute("src") ?? "");
    const hit = base ? have.get(base) : undefined;
    if (hit) {
      // The canvas (or an earlier preview) already has this photo: reuse it.
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.setAttribute("src", hit.url);
    } else {
      // Otherwise the smallest file that is sharp at the preview's real size.
      img.setAttribute("sizes", `${Math.ceil(displayWidth)}px`);
    }
  });
}

/**
 * Renders children into a node that joins the document only after `quiet`
 * has run, so nothing inside starts loading before it is tamed.
 */
function DetachedMount({ children, displayWidth, onReady }: { children: React.ReactNode; displayWidth: number; onReady?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [node] = useState(() => (typeof document === "undefined" ? null : document.createElement("div")));
  const widthRef = useRef(displayWidth);
  widthRef.current = displayWidth;
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!node || !host) return;
    quiet(node, widthRef.current);
    host.appendChild(node);
    host.setAttribute("data-pc-preview-ready", "");
    onReady?.();
    // Content a block adds later (a slide, a lazily mounted player) gets the same treatment.
    const mo = new MutationObserver(() => quiet(node, widthRef.current));
    mo.observe(node, { childList: true, subtree: true });
    return () => { mo.disconnect(); node.remove(); host.removeAttribute("data-pc-preview-ready"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);
  return <div ref={hostRef}>{node && createPortal(children, node)}</div>;
}

/** A block that throws while previewing falls back quietly; the canvas reports real errors. */
class PreviewBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Cuts animations and transitions to their end state and hides scrollbars. */
const PREVIEW_CSS = `
.pc-bp-root, .pc-bp-root * { scrollbar-width: none; }
.pc-bp-root *::-webkit-scrollbar { display: none; }
.pc-bp-root *, .pc-bp-root *::before, .pc-bp-root *::after {
  animation-duration: 1ms !important; animation-delay: 0s !important; animation-iteration-count: 1 !important;
  transition-duration: 0s !important; transition-delay: 0s !important;
}`;

/* ── Hooks ─────────────────────────────────────────────────────────────── */

function useWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** True once the element has come into view; stays true. */
export function useSeenOnce(ref: React.RefObject<HTMLElement | null>, enabled = true): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!enabled || seen) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        // Low priority: the panel paints first, previews fill in after.
        startTransition(() => setSeen(true));
      }
    }, { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled, seen]);
  return seen;
}

/** `value`, updated only after it has been still for `ms` (first value immediate). */
export function useSettled<T>(value: T, ms = 350): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (Object.is(value, settled)) return;
    const t = setTimeout(() => startTransition(() => setSettled(value)), ms);
    return () => clearTimeout(t);
  }, [value, settled, ms]);
  return settled;
}

/* ── Component ─────────────────────────────────────────────────────────── */

export interface BlockPreviewProps {
  block: Block;
  /** JSON of `block` (or any stable key for it): the preview only redraws when it changes. */
  sig: string;
  /** Frame height / width. 0.625 = 16:10. */
  aspect?: number;
  /** Shown instead if the block fails to render (the old wireframe, say). */
  fallback?: React.ReactNode;
  /** Render as soon as mounted instead of waiting to scroll into view. */
  eager?: boolean;
  className?: string;
}

function BlockPreviewImpl({ block, sig, aspect = 0.625, fallback = null, eager = false, className }: BlockPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const width = useWidth(frameRef);
  const seen = useSeenOnce(frameRef, !eager);
  const contact = usePreviewSiteContact();
  const [vw] = useState(pageWidth);
  const vh = Math.round(vw * aspect);
  const scale = width ? width / vw : 0;

  // Short blocks sit in the middle of the frame rather than at its top.
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);
  const show = scale > 0 && (eager || seen);
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!show || !el) return;
    setContentH(el.offsetHeight);
    const ro = new ResizeObserver(() => setContentH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [show]);
  const dy = contentH && contentH < vh ? Math.round((vh - contentH) / 2) : 0;
  const [failedSig, setFailedSig] = useState<string | null>(null);
  const failed = failedSig === sig;

  return (
    <div
      ref={frameRef}
      data-pc-preview=""
      aria-hidden
      // React 19 passes boolean `inert` through to the DOM.
      inert
      className={cn("relative w-full overflow-hidden rounded-md border bg-white", className)}
      style={{ aspectRatio: `${1 / aspect}` }}
    >
      <style href="pc-block-preview" precedence="pc-block-preview">{PREVIEW_CSS}</style>
      {!show && <div className="absolute inset-0 bg-muted/40" />}
      {failed && <div className="absolute inset-0">{fallback}</div>}
      {show && !failed && (
        <div
          className="cms-canvas-light pc-bp-root absolute left-0 top-0 origin-top-left select-none"
          style={{ width: vw, height: vh, transform: `scale(${scale})`, background: "hsl(var(--background))" }}
        >
          {/* cms-builder-canvas: the canvas's own CSS (reveal-on-scroll shown,
              fixed headers kept in flow); isolate + overflow keep it boxed in. */}
          <div className="cms-builder-canvas isolate relative h-full overflow-hidden">
            <div ref={contentRef} style={dy ? { transform: `translateY(${dy}px)` } : undefined}>
              {/* Keyed by content: a changed block mounts fresh into a new
                  detached node (quieted again), and a failed render retries. */}
              <PreviewBoundary key={sig} onError={() => setFailedSig(sig)}>
                <DetachedMount displayWidth={width}>
                  <InlineEditContext.Provider value={null}>
                    <SiteContactProvider value={contact}>
                      <PreviewContent block={block} />
                    </SiteContactProvider>
                  </InlineEditContext.Provider>
                </DetachedMount>
              </PreviewBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Redraws only when `sig` (the block's content) or the frame shape changes. */
export const BlockPreview = memo(BlockPreviewImpl, (a, b) =>
  a.sig === b.sig && a.aspect === b.aspect && a.eager === b.eager && a.className === b.className);
