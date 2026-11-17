"use client";

import React, { useId, useRef, useState } from "react";
import type { MediaTabsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ProButton, ProFrame, ProHeading, ProIcon, isDarkSection, proRoot } from "@/components/blocks/_primitives/pro";

/**
 * Screenshot tabs: a short list of features, each with its own picture in a
 * browser window. From tablets up, choosing an item swaps the picture (list
 * beside it, or tabs in a row above it). On phones nothing is hidden: every
 * item is shown in turn with its picture under it, so there is nothing to tap.
 * Keyboard: arrow keys move between items.
 */
export function MediaTabsBlock({ block }: { block: MediaTabsBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block);
  const items = (data.items ?? []).filter((it) => it.title?.trim());
  const [active, setActive] = useState(0);
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.min(active, Math.max(0, items.length - 1));
  const ratio = data.imageRatio || 1.6;
  const top = data.layout === "top";

  const onKey = (e: React.KeyboardEvent) => {
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    if (!fwd && !back) return;
    e.preventDefault();
    const next = (current + (fwd ? 1 : -1) + items.length) % items.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  // Phones: a plain list, each item with its picture.
  const phone = (
    <div className="md:hidden grid grid-cols-1 gap-10">
      {items.map((it) => (
        <div key={it.id} className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <ProIcon name={it.icon} className="w-5 h-5 pcx-accent-text" />
            <h3 className="pcx-h3">{it.title}</h3>
          </div>
          {it.description && <p className="pcx-small !text-[0.9375rem] mb-4">{it.description}</p>}
          <ProFrame src={it.imageUrl} alt={it.imageAlt || it.title} url={it.frameUrl} ratio={ratio} />
        </div>
      ))}
    </div>
  );

  const panels = (
    <div className="min-w-0">
      {items.map((it, i) => (
        <div key={it.id} role="tabpanel" id={`${uid}-p${i}`} aria-labelledby={`${uid}-t${i}`} hidden={i !== current}>
          <ProFrame src={it.imageUrl} alt={it.imageAlt || it.title} url={it.frameUrl} ratio={ratio} />
        </div>
      ))}
    </div>
  );

  const list = top ? (
    <div role="tablist" aria-label={data.title || "Features"} onKeyDown={onKey} className="flex flex-wrap justify-center gap-2 mb-8">
      {items.map((it, i) => (
        <button key={it.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${uid}-t${i}`} aria-controls={`${uid}-p${i}`}
          aria-selected={i === current} tabIndex={i === current ? 0 : -1} onClick={() => setActive(i)}
          className={cn("pcx-btn !min-h-10 !py-2", i === current ? "pcx-btn-solid" : "pcx-btn-outline")}>
          <ProIcon name={it.icon} className="w-4 h-4" />{it.title}
        </button>
      ))}
    </div>
  ) : (
    <div role="tablist" aria-orientation="vertical" aria-label={data.title || "Features"} onKeyDown={onKey} className="grid gap-2 content-start">
      {items.map((it, i) => {
        const on = i === current;
        return (
          <button key={it.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${uid}-t${i}`} aria-controls={`${uid}-p${i}`}
            aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => setActive(i)}
            className="pcx-card-hover w-full rounded-xl border p-4 sm:p-5 text-left cursor-pointer"
            style={{ borderColor: on ? "var(--pcx-line-strong)" : "transparent", background: on ? "var(--pcx-card)" : "transparent", boxShadow: on ? "0 1px 2px rgb(11 16 32 / .06)" : undefined }}>
            <span className="flex items-center gap-3">
              <ProIcon name={it.icon} className={cn("w-5 h-5 shrink-0", on && "pcx-accent-text")} />
              <span className="pcx-h3 !text-base">{it.title}</span>
            </span>
            {it.description && <span className={cn("pcx-small block mt-1.5 pl-8", !on && "lg:line-clamp-1")}>{it.description}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className={proRoot(dark)}>
      <div className="pcx-wrap">
        <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} align={top ? "center" : "left"} />
        {phone}
        <div className="hidden md:block">
          {top ? (
            <>
              {list}
              <div className="mx-auto max-w-[64rem]">{panels}</div>
              {items[current]?.description && <p className="pcx-body mt-6 text-center mx-auto max-w-[40rem]">{items[current].description}</p>}
            </>
          ) : (
            <div className={cn("grid gap-8 lg:gap-12 items-start", data.mediaSide === "left" ? "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]")}>
              <div className={cn(data.mediaSide === "left" && "md:order-2")}>{list}</div>
              {panels}
            </div>
          )}
        </div>
        {data.primaryButton?.label && <div className={cn("mt-10 flex", top && "justify-center")}><ProButton href={data.primaryButton.url} label={data.primaryButton.label} kind="outline" /></div>}
      </div>
    </section>
  );
}
