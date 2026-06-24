"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { FooterBlockProps } from "@/types/cms";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Phone, Mail, MapPin } from "lucide-react";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  tiktok: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>,
  whatsapp: <MessageCircle className="h-4 w-4" />,
};

export function FooterBlock({ block }: { block: FooterBlockProps }) {
  const { data } = block;
  const {
    logo, logoText, tagline, columns = [], socials = [],
    copyrightText, copyrightYear = true,
    backgroundColor, textColor, accentColor,
    showNewsletter, newsletterLabel, newsletterPlaceholder,
    bottomLinks = [], style = "dark",
  } = data;

  const [email, setEmail] = useState("");

  const isDark = style === "dark" || (!backgroundColor && style !== "light");
  const bg = backgroundColor ?? (isDark ? "#0f2418" : "#f8f6f0");
  const fg = textColor ?? (isDark ? "#e5e7eb" : "#1f2937");
  const accent = accentColor ?? "#c9a84c";
  const mutedFg = isDark ? "#9ca3af" : "#6b7280";
  const borderCol = isDark ? "#ffffff10" : "#00000010";
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: bg, color: fg }} className="w-full">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              {logo ? (
                <Image src={logo} alt={logoText ?? "Logo"} width={140} height={48} className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-xl font-bold" style={{ color: accent }}>{logoText ?? "Brand"}</span>
              )}
            </Link>
            {tagline && (
              <p className="text-sm leading-relaxed mb-5" style={{ color: mutedFg }}>{tagline}</p>
            )}
            {/* Socials */}
            {socials.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-80"
                    style={{ backgroundColor: accent + "20", color: accent }}
                  >
                    {SOCIAL_ICONS[s.platform] ?? <span className="text-xs">{s.platform[0].toUpperCase()}</span>}
                  </a>
                ))}
              </div>
            )}
            {/* Newsletter inline */}
            {showNewsletter && (
              <form
                className="mt-5"
                onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: fg }}>{newsletterLabel ?? "Get Updates"}</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={newsletterPlaceholder ?? "Enter your email"}
                    className="flex-1 text-sm px-3 py-2 rounded-lg outline-none min-w-0"
                    style={{ backgroundColor: isDark ? "#ffffff15" : "#00000008", color: fg, border: `1px solid ${borderCol}` }}
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm font-semibold rounded-lg shrink-0"
                    style={{ backgroundColor: accent, color: isDark ? "#0f2418" : "#fff" }}
                  >
                    →
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.id}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: accent }}>
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      className="text-sm transition-opacity hover:opacity-80"
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
      <div style={{ borderTop: `1px solid ${borderCol}` }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
