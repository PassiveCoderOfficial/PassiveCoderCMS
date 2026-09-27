/**
 * Real estate display helpers shared by the public blocks, detail pages and
 * the dashboard. Currency conversion uses the fixed USD pegs of the Gulf
 * currencies (SAR 3.75, AED 3.6725, QAR 3.64, BHD 0.376, OMR 0.3845), so the
 * numbers are exact rather than a stale market rate. Anything else is shown
 * in its own currency only.
 */

export type ReListingType = "sale" | "rent" | "offplan";
export type AreaUnit = "sqm" | "sqft";

export interface ReProperty {
  id: string;
  slug: string;
  title: string;
  listing_type: ReListingType;
  property_type: string;
  status: string;
  price: number | null;
  price_max: number | null;
  price_period: string | null;
  price_on_request: boolean;
  currency: string;
  beds: number | null;
  beds_max: number | null;
  baths: number | null;
  area: number | null;
  area_unit: AreaUnit;
  city: string | null;
  country: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  furnishing: string | null;
  handover: string | null;
  payment_plan: { label: string; percent: number }[];
  amenities: string[];
  highlights: string[];
  images: string[];
  floor_plans: string[];
  brochure_url: string | null;
  video_url: string | null;
  tour_url: string | null;
  summary: string | null;
  description: string | null;
  permit_number: string | null;
  reference: string | null;
  featured: boolean;
  community?: { name: string; slug: string } | null;
  developer?: { name: string; slug: string; logo_url: string | null } | null;
}

export const USD_PEG: Record<string, number> = {
  USD: 1, SAR: 3.75, AED: 3.6725, QAR: 3.64, BHD: 0.376, OMR: 0.3845,
};

export const DISPLAY_CURRENCIES = ["SAR", "AED", "USD"] as const;

export function convertPrice(amount: number, from: string, to: string): number | null {
  if (from === to) return amount;
  const a = USD_PEG[from];
  const b = USD_PEG[to];
  if (!a || !b) return null;
  return (amount / a) * b;
}

export function formatMoney(amount: number, currency: string, compact = false): string {
  if (compact && amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${currency} ${m >= 10 ? m.toFixed(1).replace(/\.0$/, "") : m.toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (compact && amount >= 10_000) return `${currency} ${Math.round(amount / 1000)}K`;
  return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
}

const PERIOD: Record<string, string> = { year: "/yr", month: "/mo", week: "/wk", day: "/day" };

/** "SAR 2.4M", "From AED 1.2M", "SAR 85K/yr", "Price on request". */
export function priceLabel(p: Pick<ReProperty, "price" | "price_max" | "price_on_request" | "currency" | "price_period" | "listing_type">, displayCurrency?: string, compact = true): string {
  if (p.price_on_request || p.price == null) return "Price on request";
  const cur = displayCurrency && convertPrice(1, p.currency, displayCurrency) != null ? displayCurrency : p.currency;
  const amount = convertPrice(Number(p.price), p.currency, cur) ?? Number(p.price);
  const base = formatMoney(amount, cur, compact);
  const period = p.listing_type === "rent" && p.price_period ? PERIOD[p.price_period] ?? "" : "";
  const from = p.listing_type === "offplan" || p.price_max ? "From " : "";
  return `${from}${base}${period}`;
}

const SQFT_PER_SQM = 10.7639;

export function areaLabel(area: number | null, unit: AreaUnit, display?: AreaUnit): string {
  if (area == null) return "";
  const target = display ?? unit;
  const value = unit === target ? area : target === "sqft" ? area * SQFT_PER_SQM : area / SQFT_PER_SQM;
  return `${Math.round(value).toLocaleString("en-US")} ${target === "sqm" ? "sqm" : "sqft"}`;
}

export function bedsLabel(beds: number | null, bedsMax?: number | null): string {
  if (beds == null) return "";
  const one = (n: number) => (n === 0 ? "Studio" : `${n} Bed${n === 1 ? "" : "s"}`);
  if (bedsMax != null && bedsMax > beds) return `${beds === 0 ? "Studio" : beds}–${bedsMax} Beds`;
  return one(beds);
}

export const LISTING_TYPE_LABEL: Record<ReListingType, string> = {
  sale: "For Sale", rent: "For Rent", offplan: "Off-Plan",
};

export const PROPERTY_TYPES = [
  "apartment", "villa", "townhouse", "penthouse", "duplex", "floor", "land", "office", "retail", "building",
] as const;

export function titleCase(s: string): string {
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export function waHref(number: string | null | undefined, text: string): string | null {
  const n = (number ?? "").replace(/[^\d]/g, "").replace(/^00/, "");
  if (n.length < 8) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
