/**
 * Display currencies for the marketing site (2026-10-19).
 *
 * One international price, in USD, shown in the visitor's own money at
 * today's rate. Converting never changes the price, so switching is safe for
 * trust; checkout always bills USD. Bangladesh taka is NOT a display
 * currency: it is a separate regional plan for Bangladeshi business owners
 * (anywhere), offered on the Bangla / Bangladesh pages and to visitors in
 * Bangladesh only. A Gulf client tapping through currencies never meets a
 * taka price that looks like a third of theirs.
 */
export type DisplayCode = "USD" | "AED" | "SAR" | "QAR" | "OMR" | "KWD" | "BHD" | "MYR" | "SGD" | "EUR" | "GBP";
export type PriceCurrency = DisplayCode | "BDT";

export const DISPLAY_CODES: DisplayCode[] = ["USD", "AED", "SAR", "QAR", "OMR", "KWD", "BHD", "MYR", "SGD", "EUR", "GBP"];

/** Gulf currencies are pegged to the dollar; the rest are fallbacks until
 *  the live rates load (lib/currency/rates.ts refreshes them daily). */
export const FALLBACK_RATES: Record<DisplayCode, number> = {
  USD: 1, AED: 3.6725, SAR: 3.75, QAR: 3.64, OMR: 0.3845, KWD: 0.307, BHD: 0.376,
  MYR: 4.22, SGD: 1.29, EUR: 0.86, GBP: 0.75,
};

const EURO = new Set(["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);
const BY_COUNTRY: Record<string, DisplayCode> = {
  AE: "AED", SA: "SAR", QA: "QAR", OM: "OMR", KW: "KWD", BH: "BHD", MY: "MYR", SG: "SGD", GB: "GBP",
};

/** The visitor's own currency; Bangladesh gets its regional taka plan. */
export function currencyForCountry(country: string | null | undefined): PriceCurrency {
  const cc = (country ?? "").toUpperCase();
  if (cc === "BD") return "BDT";
  if (EURO.has(cc)) return "EUR";
  return BY_COUNTRY[cc] ?? "USD";
}

/** A USD price (cents) in another display currency, in whole units. */
export function convertUsd(usdCents: number, code: DisplayCode, rates: Partial<Record<DisplayCode, number>>): number {
  const rate = rates[code] ?? FALLBACK_RATES[code];
  return Math.round((usdCents / 100) * rate);
}

/** "$299", "AED 1,099", "€257": no decimals, a price not a calculator. */
export function formatDisplay(amount: number, code: DisplayCode): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(amount)
    // narrowSymbol gives "$" for SGD and plain codes for Gulf currencies;
    // keep the code where "$" would be ambiguous.
    .replace(/^\$/, code === "USD" ? "$" : `${code} `);
}

/** A USD price (cents) shown in `code`. */
export function showUsd(usdCents: number, code: DisplayCode, rates: Partial<Record<DisplayCode, number>>): string {
  return formatDisplay(code === "USD" ? usdCents / 100 : convertUsd(usdCents, code, rates), code);
}
