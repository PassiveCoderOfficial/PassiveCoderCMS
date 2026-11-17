// Ecommerce currency now reads the SITE-WIDE base currency (site_settings),
// shared with the accounting system. Thin re-export so existing imports work.
import { getSiteCurrency } from "@/lib/currency/currency-server";
import { formatMoney, type CurrencyConfig } from "@/lib/currency/currencies";

export type { CurrencyConfig };
export { formatMoney as formatWithConfig };

/** @deprecated use getSiteCurrency — kept for back-compat. */
export const getCurrencyConfig = getSiteCurrency;
