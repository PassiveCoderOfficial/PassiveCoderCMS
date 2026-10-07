"use client";

import React from "react";
import { Clock, Info, Mail, MapPin, Phone } from "lucide-react";

import type { NavigationBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { WaIcon, isExternal } from "@/components/blocks/_primitives/showcase";
import { useSiteContact, waLink, telLink } from "@/components/site/site-contact-context";

// lucide dropped brand marks; simple inline glyphs instead.
const Facebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z" /></svg>
);
const Instagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);

export type TopBar = NonNullable<NavigationBlockProps["data"]["topBar"]>;

const ICONS = { pin: MapPin, phone: Phone, clock: Clock, mail: Mail, facebook: Facebook, instagram: Instagram, info: Info } as const;
export const TOP_BAR_ICONS = Object.keys(ICONS) as (keyof typeof ICONS)[];

/**
 * Thin strip above the header: short info items on the left (address, hours,
 * promo text), links on the right, then the phone and a WhatsApp pill taken
 * from the site's contact details. Scrolls away; the nav below stays sticky.
 */
export function NavTopBar({ bar }: { bar: TopBar }) {
  const c = useSiteContact();
  const items = bar.items ?? [];
  const left = items.filter((i) => i.side !== "right");
  const right = items.filter((i) => i.side === "right");
  const phone = bar.showPhone !== false ? c.phone : null;
  const wa = bar.showWhatsapp !== false ? waLink(c.whatsapp || c.phone, bar.whatsappText || undefined) : null;
  const Item = ({ it }: { it: TopBar["items"][number] }) => {
    const Icon = it.icon ? ICONS[it.icon as keyof typeof ICONS] : null;
    const inner = <>{Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}<span>{it.text}</span></>;
    const cls = cn("inline-flex items-center gap-1.5 whitespace-nowrap", it.hideOnMobile && "hidden md:inline-flex");
    return it.url
      ? <a href={it.url} className={cn(cls, "hover:opacity-100 opacity-90")} {...(isExternal(it.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>
      : <span className={cls}>{inner}</span>;
  };
  if (bar.align === "center") {
    return (
      <div className={cn("w-full text-[14px] text-center", bar.uppercase && "uppercase tracking-[.03em]")} style={{ background: bar.background || "hsl(var(--primary))", color: bar.textColor || "rgba(255,255,255,.9)" }}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-6 flex-wrap">{items.map((it) => <Item key={it.id} it={it} />)}</div>
      </div>
    );
  }
  return (
    <div className="w-full text-[12.5px]" style={{ background: bar.background || "hsl(var(--pc-fg-root, var(--foreground)))", color: bar.textColor || "rgba(255,255,255,.75)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0 overflow-hidden">{left.map((it) => <Item key={it.id} it={it} />)}</div>
        <div className="flex items-center gap-5 shrink-0">
          {right.map((it) => <Item key={it.id} it={it} />)}
          {phone && <a href={telLink(phone) ?? "#"} className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3.5 h-3.5" />{phone}</a>}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-white" style={{ background: "#25D366" }}>
              <WaIcon className="w-3.5 h-3.5" />{bar.whatsappLabel || "WhatsApp"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
