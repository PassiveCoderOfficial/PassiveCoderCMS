"use client";

import React, { useState } from "react";
import type { NavigationBlockProps } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavigationBlock({ block, identityLogo, identityLogoDark }: {
  block: NavigationBlockProps;
  identityLogo?: string | null;
  identityLogoDark?: string | null;
}) {
  const { data } = block;
  const { logoText, logoUrl, items, sticky, transparent, style, backgroundColor, textColor, showCta, ctaLabel, ctaUrl } = data;
  // Block-level logo takes priority; fall back to site identity logo
  const logo = data.logo || identityLogo || null;
  const logoDark = identityLogoDark || logo;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navStyle = {
    backgroundColor: transparent ? "transparent" : (backgroundColor ?? "#fff"),
    color: textColor ?? "#111827",
  };

  return (
    <nav
      className={cn("w-full z-50", sticky && "sticky top-0", style === "centered" && "text-center")}
      style={navStyle}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={cn("flex items-center h-16 gap-6", style === "centered" && "justify-center")}>
          {/* Logo */}
          <Link href={logoUrl ?? "/"} className="flex items-center gap-2 shrink-0">
            {logo ? (
              <Image src={logo} alt={logoText ?? "Logo"} width={120} height={40} className="h-9 w-auto object-contain" />
            ) : (
              <span className="text-lg font-bold" style={{ color: textColor ?? "#111827" }}>{logoText ?? "Brand"}</span>
            )}
          </Link>

          {/* Desktop Nav */}
          <ul className={cn("hidden md:flex items-center gap-1", style === "centered" ? "mx-auto" : "ml-4 flex-1")}>
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.url}
                  target={item.target}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/5 transition-colors"
                  style={{ color: textColor ?? "#374151" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {showCta && ctaLabel && ctaUrl && (
            <div className="hidden md:block shrink-0">
              <Link
                href={ctaUrl}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                {ctaLabel}
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden ml-auto p-2 rounded-md hover:bg-black/5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t" style={{ backgroundColor: backgroundColor ?? "#fff" }}>
          <ul className="px-4 py-3 space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.url}
                  className="block px-3 py-2 rounded-md text-sm hover:bg-black/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {showCta && ctaLabel && ctaUrl && (
              <li>
                <Link
                  href={ctaUrl}
                  className="block px-3 py-2 rounded-md text-sm font-medium bg-gray-900 text-white text-center mt-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {ctaLabel}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
