"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// True viewport isolation for the Tablet/Mobile breakpoint preview. Every
// block uses viewport-based Tailwind breakpoints (md:/lg:), which evaluate
// against the real browser window — a plain width-constrained <div> doesn't
// isolate them, so e.g. a Hero title styled `md:text-7xl` still renders at
// its desktop size squeezed into a 375px box. An iframe gives the content a
// genuinely separate viewport, so md:/lg: fire correctly for the preview
// width instead of the outer window's.
//
// The portal renders `children` into the iframe's own document body, but
// stays in the SAME React fiber tree / JS realm (no iframe.src navigation
// happens) — the Zustand builder store, dnd-kit contexts, and inline-editing
// context all keep working unmodified.
export function PreviewFrame({ width, children }: { width: number; children: React.ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setup = () => {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      // Iframes don't inherit the parent document's stylesheets — clone
      // every <link rel="stylesheet"> / <style> tag from the parent <head>.
      doc.head.innerHTML = "";
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        doc.head.appendChild(node.cloneNode(true));
      });

      // Deliberately do NOT copy the dashboard's `dark` class onto the preview
      // document. next-themes toggles that class on <html> for the ADMIN UI,
      // but the published site never carries it — its palette comes from the
      // tenant's own theme. Mirroring it here made blocks that use
      // bg-background / text-foreground render against the dark palette in the
      // canvas while the live page rendered light, so the editor showed
      // different colours than the site it was editing.
      doc.documentElement.className = "";
      // No `dark` class is copied onto this document (above), so the tenant's
      // template palette at :root applies cleanly and no neutralising wrapper
      // is needed. Background comes from that palette rather than a hardcoded
      // white, which would fight dark templates.
      doc.body.className = "min-h-full";
      doc.body.style.background = "hsl(var(--background))";

      setMountNode(doc.body);
    };

    if (iframe.contentDocument?.readyState === "complete") setup();
    iframe.addEventListener("load", setup);
    return () => iframe.removeEventListener("load", setup);
  }, []);

  return (
    <>
      <iframe
        ref={iframeRef}
        title="Preview"
        style={{ width, border: "none", display: "block" }}
        className="h-full min-h-[600px]"
      />
      {mountNode && createPortal(children, mountNode)}
    </>
  );
}
