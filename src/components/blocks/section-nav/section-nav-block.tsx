"use client";

import React, { useEffect, useState } from "react";
import type { SectionNavBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ProButton, isDarkSection, proRoot } from "@/components/blocks/_primitives/pro";

const clean = (a: string) => a.trim().replace(/^#/, "");

/**
 * Section links: a slim row of links to the sections of a long page (each
 * section's anchor is set in its Layout settings). Can stay at the top of the
 * screen while scrolling, and marks the section in view. Scrolls sideways on
 * phones. Without JavaScript the links still jump to their sections.
 */
export function SectionNavBlock({ block }: { block: SectionNavBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block);
  const items = (data.items ?? []).filter((it) => it.label?.trim() && clean(it.anchor ?? ""));
  const [current, setCurrent] = useState<string | null>(null);
  const key = items.map((it) => clean(it.anchor)).join("|");

  useEffect(() => {
    const ids = key ? key.split("|") : [];
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id); }
      // The first listed section that is in the reading band wins.
      setCurrent(ids.find((id) => visible.has(id)) ?? null);
    }, { rootMargin: "-25% 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);

  if (!items.length) return null;
  return (
    <nav className={proRoot(dark)} aria-label={data.label || "On this page"}>
      <div className="pcx-wrap flex items-center gap-4 min-h-[3.25rem]">
        {data.label && <span className="pcx-eyebrow hidden lg:inline-flex shrink-0" style={{ color: "var(--pcx-faint)" }}>{data.label}</span>}
        <ul className="m-0 p-0 list-none flex flex-1 items-center gap-1 overflow-x-auto min-w-0" style={{ scrollbarWidth: "none" }}>
          {items.map((it) => {
            const id = clean(it.anchor);
            const on = current === id;
            return (
              <li key={it.id} className="shrink-0">
                <a href={`#${id}`} aria-current={on ? "true" : undefined}
                  className={cn("block rounded-lg px-3 py-2 text-sm font-medium no-underline whitespace-nowrap")}
                  style={{ color: on ? "var(--pcx-fg)" : "var(--pcx-sub)", background: on ? "var(--pcx-line)" : undefined }}>
                  {it.label}
                </a>
              </li>
            );
          })}
        </ul>
        {data.button?.label && <ProButton href={data.button.url} label={data.button.label} kind="primary" className="hidden sm:inline-flex shrink-0 !min-h-9 !py-1.5 !text-sm" />}
      </div>
    </nav>
  );
}
