"use client";

import React from "react";
import { Clock, MapPin, Phone } from "lucide-react";
import type { CTABlockProps } from "@/types/cms";
import { InlineText } from "../inline-text";
import { WaIcon, scStyle, isExternal } from "@/components/blocks/_primitives/showcase";
import { useSiteContact, waLink, telLink, mapLinks } from "@/components/site/site-contact-context";

/**
 * Dark "visit us" band: text, address / phone / hours, two buttons and a map.
 * Address and phone come from the site's contact details unless the block
 * overrides them. Empty button links fall back to WhatsApp (primary) and
 * map directions (secondary), so a client never has to build those URLs.
 */
export function CTAVisitMap({ block }: { block: CTABlockProps }) {
  const { data } = block;
  const c = useSiteContact();
  const address = data.address || c.address || "";
  const phone = data.phone || c.phone || "";
  const maps = mapLinks(data.mapQuery || address);
  const p = data.primaryButton, s = data.secondaryButton;
  const pHref = p?.url || waLink(c.whatsapp || c.phone, "Hi, I would like to know more.") || telLink(phone) || "#";
  const sHref = s?.url || maps?.link || "#";
  const ext = (u: string) => (isExternal(u) ? { target: "_blank", rel: "noopener noreferrer" } : {});
  const showMap = data.showMap !== false && !!maps;
  return (
    <section className="sc-root sc-on-dark sc-dark-grad px-6 py-16 sm:py-24" style={scStyle(data.colors)}>
      <div className={`max-w-7xl mx-auto grid gap-10 lg:gap-14 items-center ${showMap ? "lg:grid-cols-[1fr_1.1fr]" : ""}`}>
        <div data-reveal>
          {data.eyebrow && <span className="sc-eyebrow mb-3"><InlineText blockId={block.id} field="eyebrow" value={data.eyebrow} /></span>}
          <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold leading-[1.08] tracking-tight text-white">
            <InlineText blockId={block.id} field="title" value={data.title} />
          </h2>
          {data.description && (
            <p className="mt-4 text-lg text-white/70 leading-relaxed"><InlineText blockId={block.id} field="description" value={data.description} /></p>
          )}
          <ul className="grid gap-3 my-7 text-white/80">
            {address && <li className="flex gap-3 items-start"><MapPin className="w-4 h-4 mt-1 shrink-0 sc-accent" /><span>{address}</span></li>}
            {phone && <li className="flex gap-3 items-center"><Phone className="w-4 h-4 shrink-0 sc-accent" /><a href={telLink(phone) ?? "#"} className="text-white font-bold">{phone}</a></li>}
            {data.hours && <li className="flex gap-3 items-start"><Clock className="w-4 h-4 mt-1 shrink-0 sc-accent" /><span className="whitespace-pre-line">{data.hours}</span></li>}
          </ul>
          <div className="flex flex-wrap gap-3">
            {p?.label && <a href={pHref} {...ext(pHref)} className="sc-btn sc-btn-grad">{!p.url && pHref.includes("wa.me") && <WaIcon />}{p.label}</a>}
            {s?.label && <a href={sHref} {...ext(sHref)} className="sc-btn sc-btn-ghost-dark"><MapPin className="w-4 h-4" />{s.label}</a>}
          </div>
        </div>
        {showMap && (
          <div data-reveal className="overflow-hidden rounded-[calc(var(--radius)+14px)] border aspect-[4/3] shadow-2xl"
            style={{ borderColor: "color-mix(in srgb, var(--sc-accent-c) 30%, transparent)" }}>
            <iframe src={maps!.embed} title="Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-full border-0 block" />
          </div>
        )}
      </div>
    </section>
  );
}
