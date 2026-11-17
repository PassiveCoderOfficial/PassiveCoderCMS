"use client";

import { useEffect } from "react";

/**
 * Mounts a single IntersectionObserver that reveals any element carrying a
 * `data-reveal` attribute as it scrolls into view (see the `[data-reveal]`
 * rules in globals.css). One observer for the whole page keeps this cheap.
 * Place once in each site layout. Reduced-motion users get instant content
 * via the CSS media query, and this also reveals everything immediately as
 * a fail-safe if IntersectionObserver is unavailable.
 *
 * Layouts persist across client-side navigations, so a scan-once-on-mount
 * observer never saw the next page's elements and they stayed invisible. A
 * MutationObserver picks up every element added later (new page, client
 * blocks that render after hydration).
 */
export function ScrollReveal() {
  useEffect(() => {
    const reveal = (el: Element) => el.setAttribute("data-revealed", "");
    const io = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries, obs) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                reveal(entry.target);
                obs.unobserve(entry.target);
              }
            }
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
        );
    const watch = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach((el) => (io ? io.observe(el) : reveal(el)));
    };
    watch(document);
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches("[data-reveal]:not([data-revealed])")) (io ? io.observe(n) : reveal(n));
          watch(n);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io?.disconnect(); mo.disconnect(); };
  }, []);

  return null;
}
