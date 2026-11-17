import React from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";

/**
 * Shared pieces of the "Pro" family of layouts (hero product, features
 * pro-bento, pricing pro-tiers, cta pro-band, table compare, code, media
 * tabs, section nav). Styling lives in app/pro.css (.pcx-*); colours follow
 * the site theme. No client code here, so server and client blocks can both
 * import it.
 */

/** Relative luminance of a hex / rgb() colour; null when it cannot be read. */
function luminance(input?: string): number | null {
  if (!input) return null;
  const c = input.trim();
  let r: number, g: number, b: number, a = 1;
  const hex = /^#([0-9a-f]{3,8})$/i.exec(c);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
  } else {
    const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(c);
    if (!m) return null;
    r = +m[1]; g = +m[2]; b = +m[3];
    if (m[4]) a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : +m[4];
  }
  // A see-through colour sits on the (light) page: treat it as light.
  if (a < 0.5) return 1;
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * True when the section Background the editor picked is dark, so the block
 * should draw light text. One setting (the background) instead of a second
 * "tone" switch that could disagree with it. `override` is a block's own
 * optional tone field for the rare case the background is a photo.
 */
export function isDarkSection(block: Pick<Block, "background">, override?: "light" | "dark" | "auto" | ""): boolean {
  if (override === "dark") return true;
  if (override === "light") return false;
  const bg = block.background;
  if (!bg) return false;
  if (bg.type === "color") { const l = luminance(bg.color); return l != null && l < 0.2; }
  if (bg.type === "gradient") {
    const first = /#[0-9a-f]{3,8}|rgba?\([^)]*\)/i.exec(bg.gradient ?? "")?.[0];
    const l = luminance(first); return l != null && l < 0.2;
  }
  if (bg.type === "image") return (bg.imageOverlayOpacity ?? 0) >= 0.4;
  return false;
}

export const proRoot = (dark: boolean, className?: string) => cn("pcx", dark && "pcx-dark", className);

export const isExternalHref = (url?: string) => !!url && /^https?:\/\//.test(url);

/** Internal links through the router, outside links in a new tab. */
export function ProLink({ href, className, children, ariaLabel }: { href: string; className?: string; children: React.ReactNode; ariaLabel?: string }) {
  if (isExternalHref(href)) return <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>{children}</a>;
  // In-page anchors and API routes (checkout) are plain links: no prefetch, no client routing.
  if (href.startsWith("#") || href.startsWith("/api/")) return <a href={href} className={className} aria-label={ariaLabel}>{children}</a>;
  return <Link href={href} className={className} aria-label={ariaLabel}>{children}</Link>;
}

export type ProButtonKind = "primary" | "outline" | "solid";

export function ProButton({ href, label, kind = "primary", large, icon, className }: { href?: string; label?: string; kind?: ProButtonKind; large?: boolean; icon?: React.ReactNode; className?: string }) {
  if (!label) return null;
  return (
    <ProLink href={href || "#"} className={cn("pcx-btn", `pcx-btn-${kind}`, large && "pcx-btn-lg", className)}>
      {icon}{label}
    </ProLink>
  );
}

/** Lucide icon by its name (e.g. "Zap"); null for unknown names. "Github" draws the GitHub mark. */
export function ProIcon({ name, className, strokeWidth = 1.75 }: { name?: string; className?: string; strokeWidth?: number }) {
  if (!name) return null;
  if (name === "Github" || name === "GitHub") return <GithubMark className={className} />;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>>)[name];
  return Icon ? <Icon className={className} strokeWidth={strokeWidth} aria-hidden /> : null;
}

export const GithubMark = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

/** Icon for a button whose link goes to GitHub, else nothing. */
export const linkIcon = (url?: string) => (url && /github\.com/i.test(url) ? <GithubMark className="w-[1.125rem] h-[1.125rem]" /> : null);

/** Eyebrow + title + lead used across the family. */
export function ProHeading({ eyebrow, title, subtitle, align = "left", as = "h2", className }: {
  eyebrow?: string; title?: string; subtitle?: string; align?: "left" | "center"; as?: "h1" | "h2"; className?: string;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  const H = as;
  return (
    <div className={cn("pcx-head", align === "center" && "pcx-head-center", className)}>
      {eyebrow && <p className="pcx-eyebrow">{eyebrow}</p>}
      {title && <H className={as === "h1" ? "pcx-h1" : "pcx-h2"}>{title}</H>}
      {subtitle && <p className="pcx-lead">{subtitle}</p>}
    </div>
  );
}

/**
 * A screenshot in a quiet browser window. `ratio` (width / height) reserves
 * the space before the image loads, so nothing shifts. Plain <img>: these are
 * pre-sized files, and the metered image optimizer is not spent on them.
 */
export function ProFrame({ src, alt, url, ratio = 1.6, eager, bare, className }: {
  src?: string; alt?: string; url?: string; ratio?: number; eager?: boolean; bare?: boolean; className?: string;
}) {
  if (!src) return null;
  return (
    <figure className={cn("pcx-frame m-0 min-w-0 max-w-full", className)}>
      {!bare && (
        <div className="pcx-frame-bar" aria-hidden="true">
          <span className="pcx-frame-dots"><i /><i /><i /></span>
          {url ? <span className="pcx-frame-url">{url}</span> : <span className="flex-1" />}
          <span className="w-9 shrink-0" />
        </div>
      )}
      <div style={{ aspectRatio: String(ratio) }} className="overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} loading={eager ? "eager" : "lazy"} decoding="async" fetchPriority={eager ? "high" : undefined} className="h-full w-full object-cover object-top" />
      </div>
    </figure>
  );
}

/** Tick, cross or dash for a comparison cell; null when the text is not a yes/no word. */
export function yesNo(value: string): "yes" | "no" | "partial" | null {
  const v = value.trim().toLowerCase();
  if (["yes", "y", "✓", "✔", "true", "included", "হ্যাঁ", "نعم"].includes(v)) return "yes";
  if (["no", "n", "✗", "✕", "x", "false", "-", "–", "—", "না", "لا"].includes(v)) return "no";
  if (["partial", "~"].includes(v)) return "partial";
  return null;
}
