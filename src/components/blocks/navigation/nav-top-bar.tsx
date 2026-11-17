"use client";

import React from "react";
import { Clock, Info, Mail, MapPin, Phone } from "lucide-react";

import type { NavigationBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { WaIcon, isExternal } from "@/components/blocks/_primitives/showcase";
import { useSiteContact, waLink, telLink } from "@/components/site/site-contact-context";
import { SocialLinks } from "@/components/blocks/_primitives/social-icons";
import { LanguageMenu } from "@/components/site/language-switch";

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
/** The same icons for the Header Studio text element (menus P5: a converted top bar keeps its icons). */
export const TOP_BAR_ICON_COMPONENTS: Record<keyof typeof ICONS, React.ComponentType<{ className?: string }>> = ICONS;

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
  // One central list (Business Profile > Social Media); the bar's own list is the fallback.
  const socials = bar.showSocials ? (c.socials?.length ? c.socials : (bar.socials ?? []).filter((s) => s.url)) : [];
  // Small phones: text items may shrink with an ellipsis; right-side text
  // (lower priority than the phone/WhatsApp buttons) hides below 440px.
  const Item = ({ it, minor }: { it: TopBar["items"][number]; minor?: boolean }) => {
    const Icon = it.icon ? ICONS[it.icon as keyof typeof ICONS] : null;
    const inner = <>{Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}<span className="truncate">{it.text}</span></>;
    const cls = cn("inline-flex items-center gap-1.5 whitespace-nowrap min-w-0", it.hideOnMobile ? "hidden md:inline-flex" : minor && "max-[439px]:hidden");
    return it.url
      ? <a href={it.url} className={cn(cls, "hover:opacity-100 opacity-90")} {...(isExternal(it.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>
      : <span className={cls}>{inner}</span>;
  };
  if (bar.align === "center") {
    return (
      <div className={cn("w-full text-[14px] text-center", bar.uppercase && "uppercase tracking-[.03em]")} style={{ background: bar.background || "hsl(var(--primary))", color: bar.textColor || "rgba(255,255,255,.9)" }}>
        {bar.scroll && items.length > 0
          ? <ScrollingItems items={items} seconds={bar.scrollSeconds ?? 30} render={(it) => <Item it={it} />} />
          : bar.rotate && items.length > 1
          ? <RotatingItems items={items} seconds={bar.rotateSeconds ?? 4} render={(it) => <Item it={it} />} />
          : <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-6 flex-wrap">{items.map((it) => <Item key={it.id} it={it} />)}</div>}
      </div>
    );
  }
  return (
    <div className={cn("w-full text-[12.5px]", bar.hideOnMobile && "max-md:hidden")} style={{ background: bar.background || "hsl(var(--pc-fg-root, var(--foreground)))", color: bar.textColor || "rgba(255,255,255,.75)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 sm:gap-4">
        {!!bar.languages?.length && <LanguageMenu languages={bar.languages} googleIcon={bar.languagesIcon === "google"} />}
        <div className={cn("flex items-center gap-5 min-w-0 overflow-hidden", left.every((it) => it.hideOnMobile) && "hidden md:flex", !!bar.languages?.length && "me-auto")}>{left.map((it) => <Item key={it.id} it={it} />)}</div>
        <div className="flex items-center justify-end gap-3 sm:gap-5 min-w-0 sm:shrink-0 ms-auto">
          {socials.length > 0 && (
            <div className="flex items-center gap-2 shrink-0" data-pc-top-socials="">
              {bar.socialsLabel && <span className="hidden sm:inline whitespace-nowrap font-semibold tracking-wide">{bar.socialsLabel}</span>}
              <SocialLinks socials={socials} brand={bar.socialsBrandColors} app={bar.socialsStyle === "app"} size="xs" chipStyle={{ background: "rgba(255,255,255,.12)" }} />
            </div>
          )}
          {right.map((it) => <Item key={it.id} it={it} minor={!!wa || !!phone} />)}
          {phone && <a href={telLink(phone) ?? "#"} className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3.5 h-3.5" />{phone}</a>}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={bar.whatsappLabel || "WhatsApp"} className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 max-[379px]:px-2 py-1 font-bold text-white" style={{ background: "#25D366" }}>
              <WaIcon className="w-3.5 h-3.5" /><span className="max-[379px]:hidden whitespace-nowrap">{bar.whatsappLabel || "WhatsApp"}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** One message at a time, sliding up to the next every few seconds. */
function RotatingItems({ items, seconds, render }: { items: TopBar["items"]; seconds: number; render: (it: TopBar["items"][number]) => React.ReactNode }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % items.length), Math.max(2, seconds) * 1000);
    return () => clearInterval(t);
  }, [items.length, seconds]);
  return (
    <div className="relative h-[2.6rem] overflow-hidden" aria-live="polite">
      {items.map((it, k) => (
        <div key={it.id} className="absolute inset-0 flex items-center justify-center px-4 transition-all duration-500"
          style={{ transform: `translateY(${k === i ? 0 : k === (i - 1 + items.length) % items.length ? -100 : 100}%)`, opacity: k === i ? 1 : 0 }}>
          {render(it)}
        </div>
      ))}
    </div>
  );
}

/** Endless right-to-left ticker of every item; pauses on hover. */
function ScrollingItems({ items, seconds, render }: { items: TopBar["items"]; seconds: number; render: (it: TopBar["items"][number]) => React.ReactNode }) {
  const run = (copy: number) => (
    <div className="flex shrink-0 items-center gap-16 pe-16" aria-hidden={copy > 0 || undefined}>
      {items.map((it) => <React.Fragment key={`${copy}-${it.id}`}>{render(it)}</React.Fragment>)}
    </div>
  );
  return (
    <div className="pc-topbar-ticker relative overflow-hidden py-2.5" dir="ltr">
      <style>{`@keyframes pc-topbar-ticker{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}.pc-topbar-ticker>div{animation:pc-topbar-ticker var(--pc-ticker-s) linear infinite}.pc-topbar-ticker:hover>div{animation-play-state:paused}@media (prefers-reduced-motion:reduce){.pc-topbar-ticker>div{animation:none}}`}</style>
      <div className="flex w-max" style={{ ["--pc-ticker-s" as string]: `${Math.max(8, seconds)}s` }}>{run(0)}{run(1)}</div>
    </div>
  );
}
