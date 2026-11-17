"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The current page's translations, read from the <link rel="alternate"
 * hreflang> tags Next renders from each page's metadata. Lets a menu or
 * footer link marked with `lang` point at THIS page in that language
 * (Pricing -> /bn/pricing), not at that language's home. Works across the
 * layout/page boundary, so the global header gets it too. Before hydration
 * the link keeps its configured URL as the fallback.
 */
export function useAlternates(): Record<string, string> {
  const pathname = usePathname();
  const [alts, setAlts] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const next = readAlternates();
      setAlts((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    read();
    // Metadata is streamed: the hreflang tags can land after hydration (and
    // change on client-side navigation), which left the switch pointing at
    // the language's home page. Re-read whenever <head> changes.
    const mo = new MutationObserver(read);
    mo.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["href", "hreflang"] });
    return () => mo.disconnect();
  }, [pathname]);
  return alts;
}

/**
 * This page's language versions from its hreflang tags, read right now.
 * The current query string rides along (/shop?category=men ->
 * /ar/shop?category=men), so a filtered list stays filtered.
 */
export function readAlternates(): Record<string, string> {
  const map: Record<string, string> = {};
  const search = window.location.search;
  document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((l) => {
    const code = (l.getAttribute("hreflang") ?? "").toLowerCase();
    const href = l.getAttribute("href") ?? "";
    if (code && code !== "x-default" && href) map[code] = search && !href.includes("?") ? `${href}${search}` : href;
  });
  return map;
}

/** The href for a nav/footer link: its translation target when it is a language switch, else its URL. */
export function hrefFor<T extends { url: string; lang?: string }>(item: T, alts: Record<string, string>): string {
  if (!item.lang) return item.url;
  const code = item.lang.toLowerCase();
  // Country pages list regional codes only (ar-ae on /ae): an "ar" link goes to /ae/ar, not the Arabic home.
  const regional = Object.keys(alts).find((k) => k.startsWith(`${code}-`));
  return alts[code] ?? alts[code.split("-")[0]] ?? (regional ? alts[regional] : item.url);
}
