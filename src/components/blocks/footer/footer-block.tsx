"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { FooterBlockProps } from "@/types/cms";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/site/brand-logo";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  instagram: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  twitter: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  linkedin: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
  youtube: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>,
  tiktok: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>,
  whatsapp: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
};

export function FooterBlock({ block }: { block: FooterBlockProps }) {
  const { data } = block;
  const {
    logo, logoText, tagline, columns = [], socials = [],
    copyrightText, copyrightYear = true,
    backgroundColor, textColor, accentColor,
    showNewsletter, newsletterLabel, newsletterPlaceholder,
    bottomLinks = [], style = "dark", logoCaption,
  } = data;

  const [email, setEmail] = useState("");

  const isDark = style === "dark" || (!backgroundColor && style !== "light");
  // Default to brand tokens (deep secondary bg + primary accent) rather than
  // the old hardcoded green/gold, so footers match the active template. An
  // explicit backgroundColor/accentColor in block data still wins.
  const bg = backgroundColor ?? (isDark ? "hsl(var(--secondary))" : "hsl(var(--muted))");
  const fg = textColor ?? (isDark ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground))");
  const accent = accentColor ?? "hsl(var(--primary))";

  // The Header/Footer Builder writes its Background control to the block-level
  // `background` prop (type color/gradient/image), NOT to data.backgroundColor.
  // Honour that first — otherwise a gradient picked in the builder silently
  // does nothing because the theme default below paints over it.
  const blockBg = block.background;
  const builderGradient = blockBg?.type === "gradient" ? blockBg.gradient : undefined;
  const builderColor = blockBg?.type === "color" ? blockBg.color : undefined;

  // With no explicit background set, light/dark derive a gradient from the
  // active theme's own tokens rather than flipping text against a flat fill.
  // Dark blends secondary into the deeper foreground ink with a hint of
  // primary; light blends the muted surface into the card with a wash of it.
  // Token-based, so it works for every template.
  // Kept within the brand hues — an earlier version blended through
  // --foreground (near-black ink), which read as a muddy black gradient on
  // every template rather than a branded one.
  const themeGradient = isDark
    ? "linear-gradient(160deg, hsl(var(--secondary)) 0%, hsl(var(--primary) / 0.85) 100%)"
    : "linear-gradient(160deg, hsl(var(--muted)) 0%, hsl(var(--card)) 55%, hsl(var(--primary) / 0.10) 100%)";

  const bgGradient = builderGradient ?? (backgroundColor || builderColor ? undefined : themeGradient);
  const bgColor = backgroundColor ?? builderColor ?? bg;
  // When a custom text color is set (e.g. white footer on a red bg), derive
  // the muted/secondary tone from it instead of the theme grey — otherwise
  // taglines/links/copyright render grey and vanish on a colored footer.
  const mutedFg = textColor ? `${textColor}cc` : (isDark ? "rgba(255,255,255,0.65)" : "hsl(var(--muted-foreground))");
  const borderCol = textColor ? `${textColor}22` : (isDark ? "#ffffff10" : "#00000010");
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: bgColor, backgroundImage: bgGradient, color: fg }} className="w-full relative overflow-hidden">
      {/* Soft radial warmth in the corner — subtle texture, not a hard block color */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: accent }}
      />

      {/* Newsletter / CTA strip — separated visually from the link grid so the
          footer reads as "one more conversion moment", not just a link dump. */}
      {showNewsletter && (
        <div className="relative border-b" style={{ borderColor: borderCol }}>
          <div className="max-w-7xl mx-auto px-6 py-9 flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-lg font-semibold" style={{ color: fg, fontFamily: "var(--heading-font, inherit)" }}>
                {newsletterLabel ?? "Get Updates"}
              </p>
              <p className="text-sm mt-0.5" style={{ color: mutedFg }}>Tips, offers and service updates — no spam.</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => { e.preventDefault(); setEmail(""); }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={newsletterPlaceholder ?? "Enter your email"}
                className="flex-1 md:w-64 text-sm px-4 py-2.5 rounded-full outline-none min-w-0"
                style={{ backgroundColor: isDark ? "#ffffff15" : "hsl(var(--card))", color: isDark ? fg : "hsl(var(--foreground))", border: `1px solid ${borderCol}` }}
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full shrink-0 transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: accent, color: "#ffffff" }}
              >
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main footer body */}
      <div className="relative max-w-7xl mx-auto px-6 py-14">
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:[grid-template-columns:repeat(var(--fcols),minmax(0,1fr))] gap-x-8 gap-y-10"
          style={{ ["--fcols" as string]: String(columns.length + 1) }}
        >
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-auto">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              {logo ? (
                <Image src={logo} alt={logoText ?? "Logo"} width={140} height={48} className="h-10 w-auto object-contain" />
              ) : (
                <BrandLogo size={32} color={accent} textColor={fg} text={logoText ?? "Brand"} />
              )}
            </Link>
            {tagline && (
              <p className="text-sm leading-relaxed mb-2 max-w-xs" style={{ color: mutedFg }}>{tagline}</p>
            )}
            {logoCaption && (
              <p className="text-xs mb-5" style={{ color: mutedFg }}>{logoCaption}</p>
            )}
            {/* Socials */}
            {socials.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-4">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: accentColor ? `${accentColor}1a` : "hsl(var(--primary) / 0.12)", color: accent }}
                  >
                    {SOCIAL_ICONS[s.platform] ?? <span className="text-xs">{s.platform[0].toUpperCase()}</span>}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.id}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: accent }}>
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      className="text-sm transition-colors hover:opacity-100"
                      style={{ color: mutedFg }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative" style={{ borderTop: `1px solid ${borderCol}` }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: mutedFg }}>
            {copyrightText
              ? copyrightText.replace("{year}", String(year))
              : `© ${copyrightYear ? year : ""} ${logoText ?? ""}. All rights reserved.`
            }
          </p>
          {bottomLinks.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              {bottomLinks.map((l) => (
                <Link key={l.id} href={l.url} className="text-xs hover:opacity-80 transition-opacity" style={{ color: mutedFg }}>
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
