"use client";

import { useEffect } from "react";

/**
 * Mounts a single IntersectionObserver that reveals any element carrying a
 * `data-reveal` attribute as it scrolls into view (see the `[data-reveal]`
 * rules in globals.css). One observer for the whole page keeps this cheap.
 * Place once in the site layout. Reduced-motion users get instant content
 * via the CSS media query, and this also reveals everything immediately as
 * a fail-safe if IntersectionObserver is unavailable.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"));
    if (!els.length) return;

    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.setAttribute("data-revealed", ""));
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "");
            obs.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
