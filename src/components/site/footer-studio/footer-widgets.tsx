"use client";

/**
 * Footer Studio widgets (Header & Footer Studio phase 3). One component per
 * footer-only widget. Contact, socials and opening hours fall back to the
 * site's live details (SiteContactProvider, Business Profile), the logo to
 * Site Identity, menus render through the phase-1 MenuLinkList.
 *
 * The newsletter form posts to /api/contact/submit (formName "Newsletter"),
 * the same spam-checked route as every public form (trap field, timing, bot
 * filter, banned senders via findBlock / isBlockedSender rules), so a signup
 * lands in Dashboard > Contact on every plan.
 */
import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { ArrowRight, ArrowUp, Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/cms";
import { MenuLinkList } from "@/components/blocks/navigation/menu-link-list";
import { MenuRenderer } from "@/components/blocks/navigation/menu-renderer";
import { useSiteContact, waLink, telLink, mapLinks } from "@/components/site/site-contact-context";
import { WaIcon } from "@/components/blocks/_primitives/showcase";
import { SocialIcon, SOCIAL_LABELS } from "@/components/blocks/_primitives/social-icons";
import { DEFAULT_CREDIT_URL, type ResolvedCredit } from "@/lib/site/footer-credit-shared";
import { mapEmbedSrc } from "@/lib/maps/embed";
import {
  CONTACT_FIELDS, PAYMENT_LABELS, copyrightText, hoursLines,
  type FooterWidget,
} from "@/modules/footer-studio/model";

export type FooterDevice = "desktop" | "tablet" | "mobile";

export type WidgetCtx = {
  fg: string;
  /** Softer text colour for links and secondary lines. */
  muted: string;
  /** The footer paints a dark surface. */
  onDark: boolean;
  siteName: string;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  menus: Record<string, NavItem[]>;
  hours: string | null;
  siteMap: string | null;
  /** Centre content (footer style), and on phones only (mobile option). */
  center: boolean;
  mobileCenter: boolean;
  /** Dashboard preview device (unset on the live site). */
  preview?: FooterDevice;
  /** Tiny preset thumbnail: no iframes, no forms that submit. */
  thumb?: boolean;
  credit: ResolvedCredit;
  /** Id of the copyright widget that carries the credit (the first one). */
  creditOn: string | null;
  year: number;
};

/** Flex alignment for centred footers (always, or on phones only). */
export function justify(ctx: WidgetCtx): string {
  if (ctx.center) return "justify-center";
  if (!ctx.mobileCenter) return "";
  if (ctx.preview) return ctx.preview === "mobile" ? "justify-center" : "";
  return "max-sm:justify-center";
}

function linkItems(w: FooterWidget): NavItem[] {
  return (w.links ?? []).map((l) => ({ id: l.id, label: l.label, url: l.url, ...(l.newTab ? { target: "_blank" as const } : {}) }));
}

function WidgetTitle({ w }: { w: FooterWidget }) {
  if (!w.title) return null;
  return <h3 className="mb-3 text-sm font-semibold" data-fs-widget-title="">{w.title}</h3>;
}

function LinkList({ items, w, ctx, label, small }: { items: NavItem[]; w: FooterWidget; ctx: WidgetCtx; label: string; small?: boolean }) {
  if (!items.length) return null;
  const inline = w.layout === "inline";
  // Menus P2: a menu widget with its own look uses the menu renderer
  // (list, inline row or two columns); without one, the footer's own links.
  if (w.type === "menu" && w.menuStyle) {
    return (
      <MenuRenderer items={items} layout={inline ? "inline" : "vertical"} levels={w.levels ?? 1} style={w.menuStyle} label={label}
        className={cn(w.layout === "columns" && "pcm-cols", inline && "pcm-justify", inline && justify(ctx))} />
    );
  }
  const cols = w.layout === "columns";
  return (
    <nav aria-label={label}>
      <MenuLinkList items={items} levels={w.levels ?? 1}
        className={cn(inline ? "flex flex-wrap gap-x-5 gap-y-2 space-y-0" : cols ? "columns-2 gap-x-6 space-y-0 [&>li]:mb-2 [&>li]:break-inside-avoid" : "space-y-2", inline && justify(ctx))}
        linkClassName={cn("hover:opacity-100", small && "text-xs")} linkStyle={{ color: ctx.muted }} />
    </nav>
  );
}

export function AboutWidget({ w, ctx }: { w: FooterWidget; ctx: WidgetCtx }) {
  const h = w.height ?? 40;
  // An own text logo (menus P5) shows instead of the site's logo image, unless an own image is set.
  const src = w.imageUrl || (w.name ? null : (ctx.onDark && ctx.logoDarkUrl) || ctx.logoUrl) || null;
  return (
    <div className="space-y-3">
      {!w.hideLogo && (
        <Link href="/" aria-label={ctx.siteName ? `${ctx.siteName}, home` : "Home"} className={cn("inline-flex items-center gap-2 max-w-full", justify(ctx))} data-fs-logo="">
          {src
            ? <Image src={src} alt={ctx.siteName || "Logo"} width={Math.round(h * 3.4)} height={h} style={{ height: h, maxWidth: "100%" }} className="w-auto object-contain" />
            : <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "var(--heading-font, inherit)" }}>{w.name || ctx.siteName || "Your Business"}</span>}
        </Link>
      )}
      {w.text && <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: ctx.muted }}>{w.text}</p>}
    </div>
  );
}

export function ContactWidget({ w, ctx }: { w: FooterWidget; ctx: WidgetCtx }) {
  const site = useSiteContact();
  const fields = w.fields ?? CONTACT_FIELDS;
  const phone = w.phone || site.phone || null;
  const whatsapp = w.whatsapp || site.whatsapp || site.phone || null;
  const email = w.email || site.email || null;
  const address = w.address || site.address || null;
  const rows: React.ReactNode[] = [];
  const row = "flex items-start gap-2.5 text-sm hover:opacity-100";
  for (const f of fields) {
    if (f === "phone" && phone && telLink(phone)) {
      rows.push(<li key="p"><a href={telLink(phone)!} className={row} style={{ color: ctx.muted }}><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span dir="ltr">{phone}</span></a></li>);
    } else if (f === "whatsapp" && whatsapp && waLink(whatsapp)) {
      rows.push(<li key="w"><a href={waLink(whatsapp)!} target="_blank" rel="noopener noreferrer" className={row} style={{ color: ctx.muted }}><WaIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>WhatsApp</span></a></li>);
    } else if (f === "email" && email) {
      rows.push(<li key="e"><a href={`mailto:${email}`} className={row} style={{ color: ctx.muted }}><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="break-all">{email}</span></a></li>);
    } else if (f === "address" && address) {
      const link = mapLinks(address)?.link;
      rows.push(<li key="a">{link
        ? <a href={link} target="_blank" rel="noopener noreferrer" className={row} style={{ color: ctx.muted }}><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="whitespace-pre-line">{address}</span></a>
        : <span className={row} style={{ color: ctx.muted }}><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="whitespace-pre-line">{address}</span></span>}</li>);
    }
  }
  if (!rows.length) return null;
  return (
    <div>
      <WidgetTitle w={w} />
      <address className={cn("not-italic")}><ul className={cn("space-y-2.5", ctx.center && "inline-block text-start")}>{rows}</ul></address>
    </div>
  );
}

export function HoursWidget({ w, ctx }: { w: FooterWidget; ctx: WidgetCtx }) {
  const lines = hoursLines(w.hours ?? ctx.hours);
  if (!lines.length) return null;
  return (
    <div>
      <WidgetTitle w={w} />
      <div className={cn("flex items-start gap-2.5 text-sm", justify(ctx))} style={{ color: ctx.muted }}>
        <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <ul className="space-y-1">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </div>
    </div>
  );
}

export function SocialsWidget({ w, ctx, small }: { w: FooterWidget; ctx: WidgetCtx; small?: boolean }) {
  const site = useSiteContact().socials ?? [];
  // Own links (menus P5: a converted classic footer's list) win over the site's.
  const list = w.socials?.length ? w.socials : site;
  if (!list.length) return null;
  return (
    <div>
      <WidgetTitle w={w} />
      <ul className={cn("flex flex-wrap items-center gap-2", justify(ctx))} aria-label="Social media">
        {list.map((s) => (
          <li key={s.platform + s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}
              className={cn("inline-flex items-center justify-center rounded-full border border-current/25 transition-colors hover:bg-current/10", small ? "h-8 w-8" : "h-9 w-9")}>
              <SocialIcon platform={s.platform} className="h-4 w-4" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NewsletterWidget({ w, ctx }: { w: FooterWidget; ctx: WidgetCtx }) {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const started = useRef<number>(0);
  const id = useId();
  useEffect(() => { started.current = Date.now(); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "busy") return;
    if (ctx.preview || ctx.thumb) { setState("done"); return; }
    setState("busy");
    // Same spam-checked route as every public form: trap field, timing,
    // bot filter and banned senders are handled there.
    await fetch("/api/contact/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { Email: email.trim() }, formName: "Newsletter", website: trap, elapsedMs: Date.now() - started.current }),
    }).catch(() => undefined);
    setState("done");
  }
  return (
    <div>
      <WidgetTitle w={w} />
      {w.text && <p className="mb-3 text-sm" style={{ color: ctx.muted }}>{w.text}</p>}
      {state === "done" ? (
        <p className="inline-flex items-center gap-2 text-sm font-medium" role="status"><Check className="h-4 w-4" aria-hidden />{w.successText || "Thank you! You are subscribed."}</p>
      ) : (
        <form onSubmit={submit} className={cn("flex w-full max-w-sm gap-2", ctx.center && "mx-auto")} data-fs-newsletter="">
          <label htmlFor={id} className="sr-only">{w.placeholder || "Email address"}</label>
          <input id={id} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={w.placeholder || "Your email"}
            className="h-10 min-w-0 flex-1 rounded-full border border-current/25 bg-white/95 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-current/40" />
          {/* Trap field: people never see or fill it. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)}
            className="absolute -left-[9999px] h-px w-px opacity-0" />
          <button type="submit" disabled={state === "busy"}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition hover:-translate-y-px disabled:opacity-60"
            style={{ background: ctx.onDark ? "#ffffff" : "hsl(var(--primary))", color: ctx.onDark ? "#0f172a" : "hsl(var(--primary-foreground))" }}>
            {w.buttonLabel || "Subscribe"}<ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </form>
      )}
    </div>
  );
}

export function MapWidget({ w, ctx }: { w: FooterWidget; ctx: WidgetCtx }) {
  const site = useSiteContact();
  const height = w.mapHeight ?? 180;
  const src = mapEmbedSrc(w.mapEmbedUrl, w.mapLocation ?? null, { fallbackQuery: site.address })
    ?? mapEmbedSrc(ctx.siteMap, null, { fallbackQuery: site.address })
    ?? mapLinks(site.address)?.embed;
  if (!src) return null;
  return (
    <div>
      <WidgetTitle w={w} />
      {ctx.thumb
        ? <div className="w-full rounded-lg bg-current/10" style={{ height }} aria-hidden />
        : <iframe src={src} title={w.title || "Map"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen
            className="block w-full rounded-lg border-0" style={{ height }} />}
    </div>
  );
}

export function PaymentsWidget({ w, ctx }: { w: FooterWidget; ctx: WidgetCtx }) {
  const methods = w.methods ?? [];
  if (!methods.length && !w.imageUrl) return null;
  return (
    <div>
      <WidgetTitle w={w} />
      <ul className={cn("flex flex-wrap items-center gap-1.5", justify(ctx))} aria-label="Payment methods accepted">
        {methods.map((m) => (
          <li key={m} className="rounded-md border border-current/25 px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap">{PAYMENT_LABELS[m]}</li>
        ))}
        {w.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <li><img src={w.imageUrl} alt="Payment methods accepted" className="h-6 w-auto" loading="lazy" /></li>
        )}
      </ul>
    </div>
  );
}

export function CreditLine({ ctx }: { ctx: WidgetCtx }) {
  const c = ctx.credit;
  if (!c.show) return null;
  return c.isDefault ? (
    <span>Powered by{" "}
      <a href={DEFAULT_CREDIT_URL} target="_blank" rel="noopener" className="font-semibold hover:opacity-80" style={{ color: ctx.fg }}>Passive Coder</a>
    </span>
  ) : (
    <a href={c.url} target="_blank" rel="noopener" className="font-semibold hover:opacity-80" style={{ color: ctx.fg }}>{c.text}</a>
  );
}

export function CopyrightWidget({ w, ctx }: { w: FooterWidget; ctx: WidgetCtx }) {
  const withCredit = ctx.creditOn === w.id && ctx.credit.show;
  return (
    <p className="text-xs" style={{ color: ctx.muted }} data-fs-copyright="">
      {copyrightText(w, ctx.siteName, ctx.year)}
      {withCredit && <><span className="mx-2 opacity-50" aria-hidden>·</span><CreditLine ctx={ctx} /></>}
    </p>
  );
}

export function BackToTop({ ctx }: { ctx: WidgetCtx }) {
  return (
    <button type="button" aria-label="Back to top" title="Back to top"
      onClick={() => { if (!ctx.preview) window.scrollTo({ top: 0, behavior: "smooth" }); }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-current/25 transition-colors hover:bg-current/10">
      <ArrowUp className="h-4 w-4" aria-hidden />
    </button>
  );
}

/** One widget, in a column or the bottom bar (small = bottom bar). */
export function FooterWidgetView({ w, ctx, small = false, label }: { w: FooterWidget; ctx: WidgetCtx; small?: boolean; label?: string }) {
  switch (w.type) {
    case "about": return <AboutWidget w={w} ctx={ctx} />;
    case "menu": {
      const items = ctx.menus[w.menuId ?? ""] ?? ctx.menus[""] ?? [];
      return <div className={cn(small && "text-xs")}><WidgetTitle w={w} /><LinkList items={items} w={small ? { ...w, layout: "inline" } : w} ctx={ctx} label={w.title || label || "Footer"} small={small} /></div>;
    }
    case "links":
      return <div className={cn(small && "text-xs")}><WidgetTitle w={w} /><LinkList items={linkItems(w)} w={small ? { ...w, layout: "inline" } : w} ctx={ctx} label={w.title || label || "Footer links"} small={small} /></div>;
    case "contact": return <ContactWidget w={w} ctx={ctx} />;
    case "hours": return <HoursWidget w={w} ctx={ctx} />;
    case "socials": return <SocialsWidget w={w} ctx={ctx} small={small} />;
    case "newsletter": return <NewsletterWidget w={w} ctx={ctx} />;
    case "map": return <MapWidget w={w} ctx={ctx} />;
    case "payments": return <PaymentsWidget w={w} ctx={ctx} />;
    case "copyright": return <CopyrightWidget w={w} ctx={ctx} />;
    case "text":
      if (!w.text) return null;
      return (
        <div>
          <WidgetTitle w={w} />
          {w.url
            ? <Link href={w.url} className={cn("whitespace-pre-line hover:underline", small ? "text-xs" : "text-sm")} style={{ color: ctx.muted }}>{w.text}</Link>
            : <p className={cn("whitespace-pre-line", small ? "text-xs" : "text-sm")} style={{ color: ctx.muted }}>{w.text}</p>}
        </div>
      );
    case "backToTop": return <BackToTop ctx={ctx} />;
    default: return null;
  }
}
