"use client";

import React, { useState } from "react";
import type { OptionPreviewBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ScHeading, WaIcon, scStyle, isExternal } from "@/components/blocks/_primitives/showcase";
import { useSiteContact, waLink } from "@/components/site/site-contact-context";

/**
 * Option Preview: visitors tap an option and the photo changes to show it.
 * Each option either tints the main photo (colour + strength, e.g. window
 * tint shades, frosted glass, dimmed lighting) or swaps in its own photo
 * (paint colours, flooring, before/after). An optional side panel lists
 * label/value rows (rules, specs, prices) with a button.
 */
export function OptionPreviewBlock({ block }: { block: OptionPreviewBlockProps }) {
  const d = block.data;
  const contact = useSiteContact();
  const options = d.options ?? [];
  const [active, setActive] = useState(Math.min(Math.max(d.defaultIndex ?? 0, 0), Math.max(options.length - 1, 0)));
  const dark = d.tone !== "light";
  const panel = d.panel;
  const showPanel = !!panel && panel.show !== false && !!(panel.title || panel.rows?.length || panel.text);
  const btnHref = panel?.whatsapp
    ? waLink(contact.whatsapp || contact.phone, panel.whatsappText || "Hi, can you help me choose?") ?? "#"
    : panel?.buttonUrl || "#";
  const cur = options[active];

  return (
    <section className={cn("sc-root px-6 py-16 sm:py-24", dark ? "sc-on-dark sc-dark-bg" : "bg-background")} style={scStyle(d.colors)}>
      <div className={cn("max-w-7xl mx-auto grid gap-12 items-start", showPanel && "lg:grid-cols-[1.4fr_1fr]")}>
        <div>
          <ScHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} onDark={dark} align="left" className="mb-8" />
          {options.length > 0 && (
            <div role="radiogroup" aria-label={d.title || "Options"} className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 5)}, minmax(0, 1fr))` }}>
              {options.map((o, i) => (
                <button key={o.id} type="button" role="radio" aria-checked={i === active} onClick={() => setActive(i)}
                  className={cn(
                    "rounded-[calc(var(--radius)+4px)] border px-2 py-3 text-center transition-all",
                    i === active
                      ? "sc-grad border-transparent text-white shadow-lg"
                      : dark ? "border-white/15 bg-white/[.03] text-white hover:border-white/40" : "border-border bg-card text-foreground hover:border-primary",
                  )}>
                  <b className="block text-lg sm:text-xl font-extrabold" style={{ fontFamily: "var(--heading-font)" }}>{o.label}</b>
                  {o.sublabel && <span className={cn("hidden sm:block text-[11px] leading-tight mt-0.5", i === active ? "text-white/85" : dark ? "text-white/55" : "text-muted-foreground")}>{o.sublabel}</span>}
                </button>
              ))}
            </div>
          )}
          <div className={cn("relative mt-4 overflow-hidden rounded-[calc(var(--radius)+14px)] border-[6px] aspect-[4/3] sm:aspect-[16/8]", dark ? "border-white/10" : "border-card shadow-xl")}>
            {options.map((o, i) => {
              const img = o.mode === "image" && o.imageUrl ? o.imageUrl : d.imageUrl;
              if (!img) return null;
              // eslint-disable-next-line @next/next/no-img-element
              return <img key={o.id} src={img} alt={o.label} className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-500", i === active ? "opacity-100" : "opacity-0")} />;
            })}
            {!options.length && d.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {cur && cur.mode !== "image" && (
              <div className="absolute inset-0 transition-all duration-500" style={{ background: cur.color || "#06111F", opacity: (cur.strength ?? 50) / 100 }} />
            )}
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,.14) 0%, transparent 30%, transparent 70%, rgba(255,255,255,.06) 100%)" }} />
            {cur && d.showLabel !== false && (
              <span className="absolute left-4 bottom-4 rounded-full bg-black/60 px-3 py-1.5 text-sm font-bold text-white border border-white/20">
                {d.labelPrefix ? `${d.labelPrefix} ` : ""}{cur.label}
              </span>
            )}
          </div>
        </div>
        {showPanel && (
          <aside className={cn("rounded-[calc(var(--radius)+12px)] border p-7", dark ? "bg-white/[.04] text-white" : "bg-card")}
            style={dark ? { borderColor: "color-mix(in srgb, var(--sc-accent-c) 25%, transparent)" } : undefined}>
            {panel!.title && <h3 className={cn("text-xl font-extrabold mb-4", dark ? "text-white" : "text-foreground")}>{panel!.title}</h3>}
            {!!panel!.rows?.length && (
              <ul className="mb-5">
                {panel!.rows.map((r) => (
                  <li key={r.id} className={cn("flex justify-between items-center gap-4 py-3 border-b border-dashed", dark ? "border-white/15 text-white/75" : "border-border text-muted-foreground")}>
                    <span>{r.label}</span>
                    <b className={cn("text-xl font-extrabold", dark ? "sc-accent" : "text-primary")} style={{ fontFamily: "var(--heading-font)" }}>{r.value}</b>
                  </li>
                ))}
              </ul>
            )}
            {panel!.text && <p className={cn("text-sm leading-relaxed mb-6", dark ? "text-white/60" : "text-muted-foreground")}>{panel!.text}</p>}
            {panel!.buttonLabel && (
              <a href={btnHref} {...(isExternal(btnHref) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="sc-btn sc-btn-grad">
                {panel!.whatsapp && <WaIcon />}{panel!.buttonLabel}
              </a>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
