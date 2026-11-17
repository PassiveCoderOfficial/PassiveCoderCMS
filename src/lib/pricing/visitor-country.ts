import { cookies, headers } from "next/headers";
import type { Currency } from "./catalog";
import { countryForCode, type Country } from "./countries";

/** The visitor's chosen country survives a year; detection is per request. */
export const COUNTRY_COOKIE = "pc_country";
export const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type CountrySource = "cookie" | "geo" | "default";

export interface VisitorCountry {
  country: Country;
  currency: Currency;
  source: CountrySource;
}

/**
 * Which country's prices a visitor sees on the global pages:
 * the country they picked (cookie) wins, then Vercel's geo header, then
 * the USD default. Only countries we price separately count; everyone
 * else is "US" (international, USD). Pure: tests feed it directly.
 */
export function pickCountry({ cookie, header }: { cookie?: string | null; header?: string | null }): VisitorCountry {
  const fromCookie = countryForCode(cookie);
  if (fromCookie) return { country: fromCookie, currency: fromCookie.currency, source: "cookie" };
  const fromGeo = countryForCode(header);
  if (fromGeo && fromGeo.code !== "US") return { country: fromGeo, currency: fromGeo.currency, source: "geo" };
  const us = countryForCode("US")!;
  return { country: us, currency: "USD", source: "default" };
}

/** Server components and route handlers: resolve from the request. */
export async function resolveVisitorCountry(): Promise<VisitorCountry> {
  // Next throws "used cookies() inside after()" when a render is still
  // finishing once the response has closed (visitor/bot aborted, after()
  // callbacks already running). Nobody sees that output, so fall back to the
  // default instead of logging a platform error.
  try {
    const [c, h] = await Promise.all([cookies(), headers()]);
    return pickCountry({ cookie: c.get(COUNTRY_COOKIE)?.value, header: h.get("x-vercel-ip-country") });
  } catch {
    return pickCountry({});
  }
}
