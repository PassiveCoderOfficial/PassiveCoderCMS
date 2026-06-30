// Shared list of supported currencies — used by site Settings picker,
// ecommerce settings, and accounting. Single source of truth.

export interface CurrencyDef {
  code: string;
  symbol: string;
  name: string;
}

// Priority currencies shown first, in this exact order.
export const PRIORITY_CODES = ["USD", "BDT", "AED", "MYR", "SGD", "SAR", "QAR", "OMR"] as const;

// All currencies, unordered (display order is computed below).
const ALL_CURRENCIES: CurrencyDef[] = [
  { code: "USD", symbol: "$",  name: "US Dollar" },
  { code: "EUR", symbol: "€",  name: "Euro" },
  { code: "GBP", symbol: "£",  name: "British Pound" },
  { code: "BDT", symbol: "৳",  name: "Bangladeshi Taka" },
  { code: "INR", symbol: "₹",  name: "Indian Rupee" },
  { code: "PKR", symbol: "₨",  name: "Pakistani Rupee" },
  { code: "NPR", symbol: "₨",  name: "Nepalese Rupee" },
  { code: "LKR", symbol: "₨",  name: "Sri Lankan Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼",  name: "Saudi Riyal" },
  { code: "QAR", symbol: "﷼",  name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "﷼",  name: "Omani Rial" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
  { code: "EGP", symbol: "£",  name: "Egyptian Pound" },
  { code: "TRY", symbol: "₺",  name: "Turkish Lira" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "THB", symbol: "฿",  name: "Thai Baht" },
  { code: "PHP", symbol: "₱",  name: "Philippine Peso" },
  { code: "VND", symbol: "₫",  name: "Vietnamese Dong" },
  { code: "MMK", symbol: "K",  name: "Myanmar Kyat" },
  { code: "KHR", symbol: "៛",  name: "Cambodian Riel" },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",  name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩",  name: "South Korean Won" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "RUB", symbol: "₽",  name: "Russian Ruble" },
  { code: "UAH", symbol: "₴",  name: "Ukrainian Hryvnia" },
  { code: "ZAR", symbol: "R",  name: "South African Rand" },
  { code: "NGN", symbol: "₦",  name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵",  name: "Ghanaian Cedi" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$",  name: "Mexican Peso" },
  { code: "ARS", symbol: "$",  name: "Argentine Peso" },
  { code: "CLP", symbol: "$",  name: "Chilean Peso" },
  { code: "COP", symbol: "$",  name: "Colombian Peso" },
  { code: "PEN", symbol: "S/.", name: "Peruvian Sol" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso" },
];

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
export function formatMoney(amount: number, cfg: CurrencyConfig): string {
  const { currency, currency_symbol, currency_position } = cfg;
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
