"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import type { FooterBlockProps, FooterColumn } from "@/types/cms";
import { filterForAudience, hasAudience, menuToLinks, type MenuLink } from "@/modules/navigation/menu-model";
import { useSignedIn } from "@/components/site/use-signed-in";
import { cn } from "@/lib/utils";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/site/brand-logo";
import { useSiteContact } from "@/components/site/site-contact-context";
import { hrefFor, useAlternates } from "@/components/site/use-alternates";
import { resolveCredit, DEFAULT_CREDIT_URL } from "@/lib/site/footer-credit-shared";
import { SOCIAL_BRAND_COLORS, SOCIAL_PLATFORMS, SocialIcon } from "@/components/blocks/_primitives/social-icons";
import { uiText } from "@/modules/page-builder/ui-text";

/**
 * The links of one column (menus P2): a column that shows a saved menu
 * (menuItems, filled on the server from menuId) lists that menu's links in
 * the column's own link style; every other column keeps its typed links,
 * rendered by the caller exactly as before.
 */
function MenuColumnLinks({ col, render }: { col: FooterColumn & { menuItems: NonNullable<FooterColumn["menuItems"]> }; render: (l: MenuLink) => React.ReactNode }) {
  const signedIn = useSignedIn(hasAudience(col.menuItems));
  const links = menuToLinks(filterForAudience(col.menuItems, signedIn), { levels: col.menuLevels ?? 1 });
  return <>{links.map(render)}</>;
}

/** Classes for a menu link's device setting and depth (menu columns only). */
const menuLinkCls = (l: MenuLink) => cn(l.device === "desktop" && "hidden md:list-item", l.device === "mobile" && "md:hidden", l.depth > 0 && "ps-3") || undefined;

// Social glyphs live in _primitives/social-icons (shared with the header top bar).
const SOCIAL_ICONS: Record<string, React.ReactNode> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p, <SocialIcon key={p} platform={p} />]),
);

export function FooterBlock({ block: input, identityLogo, identityLogoDark }: { block: FooterBlockProps; identityLogo?: string | null; identityLogoDark?: string | null }) {
  // "Show social icons": the site's central list (Business Profile > Social
  // Media); the footer's own list stays as the fallback while that is empty.
  const site = useSiteContact();
  const block = input.data.showSocials && site.socials?.length ? { ...input, data: { ...input.data, socials: site.socials } } : input;
  // Variants are separate components so switching one in the editor never
  // changes the hook order inside a mounted footer.
  if (block.data.style === "retail") return <FooterRetail block={block} />;
  return <FooterClassic block={block} identityLogo={identityLogo} identityLogoDark={identityLogoDark} />;
}

/**
 * Retail: department-store footer. Link columns with plain headings, a
 * "Follow us" column of social icons, and a bottom line with the copyright
 * and an accepted-payments image. Colours: Background colour / Text colour.
 */
function FooterRetail({ block }: { block: FooterBlockProps }) {
  const alts = useAlternates();
  const d = block.data;
  const bg = d.backgroundColor ?? (block.background?.type === "color" ? block.background.color : undefined) ?? "hsl(var(--muted))";
  const fg = d.textColor ?? "#000000";
  const year = new Date().getFullYear();
  const copy = (d.copyrightText ?? "").replace("{year}", String(year));
  const cols = d.columns ?? [];
  return (
    <footer className="w-full" style={{ background: bg, color: fg }}>
      <div className="max-w-[1320px] mx-auto px-6 pt-9 pb-6">
        <div className="border-t pt-9 grid grid-cols-2 lg:[grid-template-columns:repeat(var(--fc),minmax(0,1fr))] gap-x-8 gap-y-10"
          style={{ borderColor: `${fg}33`, ["--fc" as string]: String(cols.length + ((d.socials?.length ?? 0) > 0 ? 1 : 0)) }}>
          {cols.map((c, i) => (
            <div key={c.id} className={(cols.length + ((d.socials?.length ?? 0) > 0 ? 1 : 0)) % 2 === 1 && i === cols.length - 1 && !(d.socials?.length) ? "max-lg:col-span-2" : undefined}>
              <p className="uppercase text-[16px] font-medium m-0 mb-6">{c.heading}</p>
              {c.text && <p className="text-[16px] opacity-80 whitespace-pre-line m-0 mb-3">{c.text}</p>}
              <ul className="list-none m-0 p-0 space-y-[11px]">
                {c.menuItems ? (
                  <MenuColumnLinks col={{ ...c, menuItems: c.menuItems }} render={(l) => (
                    <li key={l.id} className={menuLinkCls(l)}><Link href={hrefFor(l, alts)} target={l.target} rel={l.target === "_blank" ? "noopener noreferrer" : undefined} className="text-[16px] opacity-80 hover:opacity-100 hover:underline">{l.label}</Link></li>
                  )} />
                ) : c.links.map((l) => (
                  <li key={l.id}><Link href={hrefFor(l, alts)} className="text-[16px] opacity-80 hover:opacity-100 hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          {(d.socials?.length ?? 0) > 0 && (
            <div className={(cols.length + 1) % 2 === 1 ? "max-lg:col-span-2" : undefined}>
              <p className="uppercase text-[16px] font-medium m-0 mb-6">{d.followTitle || "Follow us"}</p>
              <div className="flex flex-wrap gap-2.5">
                {d.socials!.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform} className="[&_svg]:h-6 [&_svg]:w-6 hover:opacity-70">
                    {SOCIAL_ICONS[s.platform] ?? s.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-[12px]">
          {copy && <span>{copy}</span>}
          {d.paymentImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.paymentImage} alt="Payment methods accepted" className="h-6 w-auto" />
          )}
          {d.expertsBadge && <ExpertsBadge badge={d.expertsBadge} />}
          {d.bottomNote && <span className="sm:ml-auto">{d.bottomNote}</span>}
        </div>
      </div>
    </footer>
  );
}

function FooterClassic({ block, identityLogo, identityLogoDark }: { block: FooterBlockProps; identityLogo?: string | null; identityLogoDark?: string | null }) {
  const alts = useAlternates();
  const { data } = block;
  // The plan check is server-decided (SiteContact.creditEditable); a locked
  // plan always renders the default credit whatever the block data says.
  const siteCtx = useSiteContact();
  const credit = resolveCredit(data.credit, !!siteCtx.creditEditable, siteCtx.creditBase);
  const {
    logo, logoText, tagline, columns = [], socials = [],
    copyrightText, copyrightYear = true,
    backgroundColor, textColor, accentColor,
    showNewsletter, newsletterLabel, newsletterPlaceholder,
    showBooking, bookingTitle, bookingText, bookingLabel, bookingUrl,
    bottomLinks = [], style = "dark", logoCaption, wordmark,
  } = data;
  const [subscribed, setSubscribed] = useState(false);

  const [email, setEmail] = useState("");
  const t = uiText("footer", data);
  const newsletterText = t.opt("newsletterText");

  const isDark = style === "dark" || (!backgroundColor && style !== "light");
  // Light logo on a dark footer: the site's logo for dark backgrounds, when
  // the footer shows the normal site logo (or none) and the option is on.
  const logoSrc = data.autoLightLogo && isDark && identityLogoDark && (!logo || logo === identityLogo) ? identityLogoDark : logo;
  // Default to brand tokens (deep secondary bg + primary accent) rather than
  // the old hardcoded green/gold, so footers match the active template. An
  // explicit backgroundColor/accentColor in block data still wins.
  const bg = backgroundColor ?? (isDark ? "hsl(var(--secondary))" : "hsl(var(--muted))");
  const fg = textColor ?? (isDark ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground))");
  const accent = accentColor ?? "hsl(var(--primary))";
  // Column headings on a dark footer: the theme primary is often itself dark
  // (navy, forest), which vanished against the dark background. Fall back to
  // the footer text colour there unless an explicit accent is set.
  const headingColor = accentColor ?? (isDark ? fg : "hsl(var(--primary))");

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
      {showBooking && (
        <div className="relative border-b" style={{ borderColor: borderCol }}>
          <div className="max-w-7xl mx-auto px-6 py-9 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <div>
              <p className="text-lg font-semibold">{bookingTitle || "Book an appointment"}</p>
              <p className="text-sm mt-1" style={{ color: mutedFg }}>{bookingText || "Pick a day and time that suits you. We'll confirm your booking shortly."}</p>
            </div>
            <a href={bookingUrl || "/book"} className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold shrink-0"
              style={{ backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))" }}>
              {bookingLabel || "Book now"}
            </a>
          </div>
        </div>
      )}
      {showNewsletter && (
        <div className="relative border-b" style={{ borderColor: borderCol }}>
          <div className="max-w-7xl mx-auto px-6 py-9 flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-lg font-semibold" style={{ color: fg, fontFamily: "var(--heading-font, inherit)" }}>
                {newsletterLabel ?? "Get Updates"}
              </p>
              {newsletterText !== null && <p className="text-sm mt-0.5" style={{ color: mutedFg }}>{newsletterText}</p>}
            </div>
            <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              fetch("/api/contact/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: { Email: email.trim() }, formName: "Newsletter" }) }).catch(() => {});
              setEmail("");
              setSubscribed(true);
            }}>
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
                {subscribed ? t("newsletterDoneLabel") : t("newsletterButtonLabel")} <ArrowRight className="w-3.5 h-3.5" />
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
            <Link href={data.logoUrl || "/"} className="inline-flex items-center gap-2 mb-4">
              {logoSrc ? (
                <Image src={logoSrc} alt={logoText ?? "Logo"} width={280} height={96} className={data.logoPlate ? "h-20 w-auto object-contain rounded-xl bg-white px-3 py-2" : "h-20 w-auto object-contain"}
                  style={data.logoHeight ? { height: Math.min(Math.max(data.logoHeight, 16), 200), width: "auto" } : undefined} />
              ) : data.logoIconUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.logoIconUrl} alt="" className="h-9 w-auto object-contain" />
                  <span className="text-lg font-semibold" style={{ color: fg, fontFamily: "var(--heading-font, inherit)" }}>{logoText ?? "Brand"}</span>
                </>
              ) : (
                <BrandLogo size={32} color={accent} textColor={fg} text={logoText ?? "Brand"} />
              )}
            </Link>
            {tagline && (
              <p className="text-sm leading-relaxed mb-2 max-w-xs" style={{ color: mutedFg }}>{tagline}</p>
            )}
            {logoCaption && (
              <p className="text-xs mb-5 whitespace-pre-line" style={{ color: mutedFg }}>{logoCaption}</p>
            )}
            {/* Socials */}
            {socials.length > 0 && block.data.followTitle && (
              <p className="text-sm font-bold uppercase tracking-wider mt-6 mb-0" style={{ color: headingColor }}>{block.data.followTitle}</p>
            )}
            {socials.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-4">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={data.largeTapTargets ? "inline-flex items-center justify-center w-11 h-11 rounded-full transition-all hover:-translate-y-0.5" : "inline-flex items-center justify-center w-9 h-9 rounded-full transition-all hover:-translate-y-0.5"}
                    aria-label={s.platform}
                    style={block.data.socialBrandColors
                      ? { backgroundColor: "#fff", color: SOCIAL_BRAND_COLORS[s.platform] ?? "#111" }
                      : { backgroundColor: accentColor ? `${accentColor}1a` : "hsl(var(--primary) / 0.12)", color: accent }}
                  >
                    {SOCIAL_ICONS[s.platform] ?? <span className="text-xs">{s.platform[0].toUpperCase()}</span>}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col, i) => (
            // Phones show two columns per row; an odd last column takes the
            // full row instead of sitting alone in half of it.
            <div key={col.id} className={columns.length % 2 === 1 && i === columns.length - 1 ? "max-md:col-span-2" : undefined}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: headingColor }}>
                {col.heading}
              </h3>
              {col.text && <p className="text-sm leading-relaxed whitespace-pre-line mb-3" style={{ color: mutedFg }}>{col.text}</p>}
              <ul className={data.largeTapTargets ? "max-md:space-y-0 md:space-y-2.5" : "space-y-2.5"}>
                {col.menuItems ? (
                  <MenuColumnLinks col={{ ...col, menuItems: col.menuItems }} render={(link) => (
                    <li key={link.id} className={menuLinkCls(link)}>
                      <Link
                        href={hrefFor(link, alts)}
                        target={link.target}
                        rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                        className={data.largeTapTargets ? "text-sm transition-colors hover:opacity-100 max-md:inline-flex max-md:items-center max-md:min-h-11" : "text-sm transition-colors hover:opacity-100"}
                        style={{ color: mutedFg }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )} />
                ) : col.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={hrefFor(link, alts)}
                      className={data.largeTapTargets ? "text-sm transition-colors hover:opacity-100 max-md:inline-flex max-md:items-center max-md:min-h-11" : "text-sm transition-colors hover:opacity-100"}
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
        {/* Mobile: legal links sit above the copyright line; side by side from sm up. */}
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-center sm:text-left" style={{ color: mutedFg }}>
            {copyrightText
              ? copyrightText.replace("{year}", String(year))
              : `© ${copyrightYear ? year : ""} ${logoText ?? ""}. All rights reserved.`
            }
            {credit.show && !/passive\s?coder/i.test(logoText ?? "") && (
              <>
                <span className="mx-2 opacity-50">·</span>
                {credit.isDefault ? (
                  <>
                    Powered by{" "}
                    <a href={DEFAULT_CREDIT_URL} target="_blank" rel="noopener" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: fg }}>
                      Passive Coder
                    </a>
                  </>
                ) : (
                  <a href={credit.url} target="_blank" rel="noopener" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: fg }}>
                    {credit.text}
                  </a>
                )}
              </>
            )}
          </p>
          {block.data.expertsBadge && <ExpertsBadge badge={block.data.expertsBadge} />}
          {bottomLinks.length > 0 && (
            <div className="flex items-center justify-center gap-x-4 gap-y-2 flex-wrap">
              {bottomLinks.map((l) => (
                <Link key={l.id} href={hrefFor(l, alts)} className="text-xs hover:opacity-80 transition-opacity" style={{ color: mutedFg }}>
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      {wordmark && logoText && (
        <div className="relative overflow-hidden select-none pointer-events-none" aria-hidden="true">
          <p className="whitespace-nowrap text-center font-semibold leading-[0.78] tracking-[-0.06em] translate-y-[14%]"
            style={{ color: fg, opacity: 0.95, fontSize: "clamp(4rem, 16vw, 15rem)", fontFamily: "var(--heading-font, inherit)" }}>
            {logoText}
          </p>
        </div>
      )}
    </footer>
  );
}

/** Experts listing badge (Verified / Listed), linking to the profile. */
function ExpertsBadge({ badge }: { badge: { src: string; href: string; alt: string } }) {
  return (
    <a href={badge.href} target="_blank" rel="noopener" className="inline-flex shrink-0 hover:opacity-90 transition-opacity">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={badge.src} alt={badge.alt} width={180} height={48} loading="lazy" className="h-10 w-auto" />
    </a>
  );
}
