import type { Currency } from "./catalog";

/**
 * The countries Passive Coder sells in, one price each (2026-10-22).
 * The price follows where the business operates. Country pages show only
 * their own currency; the global page picks the visitor's country (cookie,
 * then Vercel geo header) and falls back to USD. Payment methods and tax
 * lines come from docs/business/country-research/<CC>.md.
 */
export type CountryCode = "AE" | "SA" | "QA" | "OM" | "SG" | "MY" | "BD" | "US";
export type Lang = "en" | "ar" | "bn";

export interface Country {
  code: CountryCode;
  name: string;
  nameAr?: string;
  currency: Currency;
  /** Shown beside prices, e.g. "+5% VAT". Empty when no tax applies. */
  taxLine: string;
  taxLineAr?: string;
  paymentMethods: string[];
  /** Languages of the country pages, first one is the page at /<cc>. */
  languages: Lang[];
  /** Path of the country page in each language; "" = global page. */
  paths: Partial<Record<Lang, string>>;
  /** hreflang code per language. */
  hreflang: Partial<Record<Lang, string>>;
}

export const COUNTRIES: Record<CountryCode, Country> = {
  AE: {
    code: "AE", name: "United Arab Emirates", nameAr: "الإمارات", currency: "AED",
    taxLine: "+5% VAT", taxLineAr: "+5% ضريبة القيمة المضافة",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout)"],
    languages: ["en", "ar"], paths: { en: "/ae", ar: "/ae/ar" }, hreflang: { en: "en-AE", ar: "ar-AE" },
  },
  SA: {
    code: "SA", name: "Saudi Arabia", nameAr: "السعودية", currency: "SAR",
    taxLine: "excl. VAT (reverse charge for VAT-registered businesses)", taxLineAr: "غير شامل ضريبة القيمة المضافة (احتساب عكسي للمنشآت المسجلة)",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout)"],
    languages: ["en", "ar"], paths: { en: "/sa", ar: "/sa/ar" }, hreflang: { ar: "ar-SA", en: "en-SA" },
  },
  QA: {
    code: "QA", name: "Qatar", nameAr: "قطر", currency: "QAR",
    taxLine: "", taxLineAr: "",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout)"],
    languages: ["en", "ar"], paths: { en: "/qa", ar: "/qa/ar" }, hreflang: { en: "en-QA", ar: "ar-QA" },
  },
  OM: {
    code: "OM", name: "Oman", nameAr: "عُمان", currency: "OMR",
    taxLine: "5% VAT inclusive", taxLineAr: "شامل 5% ضريبة القيمة المضافة",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout)"],
    languages: ["en", "ar"], paths: { en: "/om", ar: "/om/ar" }, hreflang: { en: "en-OM", ar: "ar-OM" },
  },
  SG: {
    code: "SG", name: "Singapore", currency: "SGD",
    taxLine: "No GST",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout)"],
    languages: ["en"], paths: { en: "/sg" }, hreflang: { en: "en-SG" },
  },
  MY: {
    code: "MY", name: "Malaysia", currency: "MYR",
    taxLine: "nett, no SST",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout)"],
    languages: ["en"], paths: { en: "/my" }, hreflang: { en: "en-MY" },
  },
  BD: {
    code: "BD", name: "Bangladesh", currency: "BDT",
    taxLine: "",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout, USD)", "bKash / Nagad / bank transfer (contact us)"],
    languages: ["bn"], paths: { bn: "/bn" }, hreflang: { bn: "bn-BD" },
  },
  // Everyone else: the global English page in USD.
  US: {
    code: "US", name: "International", currency: "USD",
    taxLine: "",
    paymentMethods: ["Visa / Mastercard (secure Dodo checkout)"],
    languages: ["en"], paths: { en: "/" }, hreflang: { en: "x-default" },
  },
};

/** Countries with their own landing pages and prices (not the USD default). */
export const SALES_COUNTRIES: CountryCode[] = ["AE", "SA", "QA", "OM", "SG", "MY"];

/** The country for an ISO code (geo header, cookie, page setting); null when
 *  it is not one we price separately. */
export function countryForCode(code: string | null | undefined): Country | null {
  const cc = (code ?? "").toUpperCase() as CountryCode;
  return cc in COUNTRIES ? COUNTRIES[cc] : null;
}

/** The currency a visitor from this country pays in. */
export function currencyForCountryCode(code: string | null | undefined): Currency {
  return countryForCode(code)?.currency ?? "USD";
}

/** Every hreflang alternate of the country/language pages, keyed by hreflang
 *  code: the full set each page lists, plus x-default = the global page. */
export const ALL_HREFLANG: Record<string, string> = Object.fromEntries([
  ...Object.values(COUNTRIES).flatMap((c) => c.languages.map((l) => [c.hreflang[l]!, c.paths[l]!] as [string, string])),
]);
