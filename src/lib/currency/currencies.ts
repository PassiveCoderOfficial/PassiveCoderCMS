// Shared list of supported currencies — used by site Settings picker,
// ecommerce settings, and accounting. Single source of truth.

// The list itself lives in src/types/api/currencies.ts (import-free) so the
// mobile app reads the same data through "@pc/api-types".
import { ALL_CURRENCIES, PRIORITY_CODES, type CurrencyDef } from "@/types/api/currencies";
export { PRIORITY_CODES, type CurrencyDef };

const byCode = (code: string) => ALL_CURRENCIES.find((c) => c.code === code)!;

// Priority block (fixed order) + the rest sorted alphabetically by name.
export const PRIORITY_CURRENCIES: CurrencyDef[] = PRIORITY_CODES.map(byCode);

export const OTHER_CURRENCIES: CurrencyDef[] = ALL_CURRENCIES
  .filter((c) => !PRIORITY_CODES.includes(c.code as (typeof PRIORITY_CODES)[number]))
  .sort((a, b) => a.name.localeCompare(b.name));

// Flat list for lookups: priority first, then alphabetical rest.
export const CURRENCIES: CurrencyDef[] = [...PRIORITY_CURRENCIES, ...OTHER_CURRENCIES];

export interface CurrencyConfig {
  currency: string;
  currency_symbol: string;
  currency_position: "before" | "after";
}

export const DEFAULT_CURRENCY: CurrencyConfig = {
  currency: "USD",
  currency_symbol: "$",
  currency_position: "before",
};

/** Format an amount with a currency config. Works with any code (falls back to symbol+number). */
/** Official UAE Dirham sign (Unicode 17, U+20C3); globals.css ships a font for it. */
export const DIRHAM_SIGN = "⃃";
const AED_TEXT_SYMBOLS = new Set(["", "AED", "aed", "د.إ", "Dh", "DH", "Dhs"]);

export function formatMoney(amount: number, cfg: CurrencyConfig): string {
  const { currency, currency_position } = cfg;
  // Dirham prices use the new dirham sign instead of the "AED" / "د.إ" text.
  const currency_symbol = currency === "AED" && AED_TEXT_SYMBOLS.has((cfg.currency_symbol ?? "").trim()) ? DIRHAM_SIGN : cfg.currency_symbol;
  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(amount);
    // Replace 3-letter ISO fallback (e.g. "BDT") with the stored symbol
    const withSymbol = formatted.replace(new RegExp(currency, "g"), currency_symbol);
    if (currency_position === "after") {
      const num = new Intl.NumberFormat("en-US").format(amount);
      return `${num}${currency_symbol}`;
    }
    return withSymbol;
  } catch {
    const num = new Intl.NumberFormat("en-US").format(amount);
    return currency_position === "after" ? `${num}${currency_symbol}` : `${currency_symbol}${num}`;
  }
}
