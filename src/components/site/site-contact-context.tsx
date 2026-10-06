"use client";

import React, { createContext, useContext } from "react";

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

/** Google Maps search link and embed URL for a free-text address. */
export function mapLinks(address?: string | null) {
  if (!address) return null;
  const q = encodeURIComponent(address);
  return { link: `https://www.google.com/maps/search/?api=1&query=${q}`, embed: `https://www.google.com/maps?q=${q}&z=15&output=embed` };
}
