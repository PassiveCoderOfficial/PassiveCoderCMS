"use client";

import React, { createContext, useContext } from "react";
import type { NoPriceSetting } from "@/lib/ecommerce/price-display";
import type { FooterSocial } from "@/types/cms";
import { googleMapLinks } from "@/lib/maps/embed";

/**
 * The tenant's primary contact details, available to every block. Blocks use
 * it as the default for phone / WhatsApp / address fields so a client fills
 * them in once (Dashboard → Contact details) instead of in every section.
 * A block's own field always wins when set.
 */
export type SiteContact = {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  /** Store default for products with no price (site_settings.product_defaults.noPrice). */
  noPrice?: NoPriceSetting | null;
  /** The site's social profiles to show (Business Profile > Social Media), in order. */
  socials?: { platform: FooterSocial["platform"]; url: string }[];
  /** Server-decided: the site's plan lets the owner hide/change the footer credit. */
  creditEditable?: boolean;
  /** Server-decided default credit (Passive Coder, or the white-label partner's). */
  creditBase?: import("@/lib/site/footer-credit-shared").CreditBase;
};

const Ctx = createContext<SiteContact>({});

export function SiteContactProvider({ value, children }: { value: SiteContact | null; children: React.ReactNode }) {
  return <Ctx.Provider value={value ?? {}}>{children}</Ctx.Provider>;
}

export function useSiteContact(): SiteContact {
  return useContext(Ctx);
}

const digits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

/** wa.me link for a number (block override first, then the site's), with optional prefilled text. */
export function waLink(number: string | null | undefined, text?: string): string | null {
  const n = digits(number);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(number?: string | null): string | null {
  const n = digits(number);
  return n ? `tel:+${n}` : null;
}

/**
 * Google Maps search link and embed URL for a free-text address. A Google
 * Maps link or embed code instead (pasted, or saved by the Map location
 * control) maps that place; plain words keep the search below unchanged.
 */
export function mapLinks(address?: string | null) {
  if (!address) return null;
  const linked = googleMapLinks(address);
  if (linked) return linked;
  const q = encodeURIComponent(address);
  return { link: `https://www.google.com/maps/search/?api=1&query=${q}`, embed: `https://www.google.com/maps?q=${q}&z=15&output=embed` };
}
