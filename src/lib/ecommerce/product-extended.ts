/**
 * Optional product-page sections ("Extended" in the product editor). Each
 * product may fill any of them; anything left empty falls back to the store
 * default in site_settings.product_defaults (Ecommerce → Product Defaults).
 */
export type ProductExtended = {
  description?: { title?: string; text?: string };
  details?: { title?: string; rows?: { label: string; value: string }[] };
  shipping?: { title?: string; text?: string };
  /** Video accordion (opens by itself): MP4 file or YouTube / Vimeo link. */
  video?: { title?: string; url?: string };
  trust?: { items?: { icon: string; label: string }[] };
  story?: { imageUrl?: string; title?: string; text?: string };
  banner?: { imageUrl?: string; alt?: string };
};

export type ExtendedKey = keyof ProductExtended;
export const EXTENDED_KEYS: ExtendedKey[] = ["description", "details", "video", "shipping", "trust", "story", "banner"];

/** Icons offered for the trust strip (lucide names). */
export const TRUST_ICONS = ["Truck", "RotateCcw", "ShieldCheck", "Gift", "Headphones", "BadgeCheck", "CreditCard", "Clock", "Sparkles", "Package"] as const;

/** True when a section has something worth showing. */
export function sectionFilled(key: ExtendedKey, v: ProductExtended[ExtendedKey] | undefined): boolean {
  if (!v) return false;
  switch (key) {
    case "description":
    case "shipping":
      return !!(v as { text?: string }).text?.trim();
    case "details":
      return !!(v as { rows?: { label: string; value: string }[] }).rows?.some((r) => r.label.trim() || r.value.trim());
    case "trust":
      return !!(v as { items?: unknown[] }).items?.length;
    case "story":
      return !!((v as { imageUrl?: string }).imageUrl || (v as { text?: string }).text?.trim());
    case "banner":
      return !!(v as { imageUrl?: string }).imageUrl;
    case "video":
      return !!(v as { url?: string }).url?.trim();
  }
}

/** Product's own section, else the store default. */
export function resolveExtended(own: ProductExtended | undefined, defaults: ProductExtended | undefined): ProductExtended {
  const out: ProductExtended = {};
  for (const k of EXTENDED_KEYS) {
    const mine = own?.[k];
    const def = defaults?.[k];
    const pick = sectionFilled(k, mine) ? mine : sectionFilled(k, def) ? def : undefined;
    if (pick) (out as Record<string, unknown>)[k] = pick;
  }
  return out;
}
