import { COUNTRIES, SALES_COUNTRIES, type CountryCode, type Lang } from "./countries";

/**
 * hreflang alternates for the root site's country / language pages.
 *
 * URL rule (2026-10-22): country first, then language, then page.
 *   /ae (en) + /ae/ar          same for /qa, /om
 *   /sa + /sa/ar               English is always the bare country path
 *   /sg, /my                   English only
 *   /ae/<service> + /ae/ar/<service>
 *   /    global English (x-default)      /bn  Bangla (bn-BD)      /ar  Arabic (ar)
 *
 * Root-tenant page slugs are these paths without the leading slash
 * ("ae", "ae/ar", "sa/ar/cleaning-website"); "home" is "/" and "bn/home"
 * is "/bn".
 */
export interface RootPageLocation {
  country: CountryCode | null;
  lang: Lang;
  /** Service / sub page path after the country + language, "" for the country home. */
  rest: string;
}

const BY_FIRST: Record<string, CountryCode> = Object.fromEntries(SALES_COUNTRIES.map((c) => [c.toLowerCase(), c]));

/** Where a root-tenant page slug sits in the country/language tree. */
export function locateRootSlug(slug: string): RootPageLocation {
  const parts = slug.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (parts[0] === "home" || parts.length === 0) return { country: null, lang: "en", rest: "" };
  if (parts[0] === "bn") return { country: null, lang: "bn", rest: parts[1] === "home" ? "" : parts.slice(1).join("/") };
  if (parts[0] === "ar") return { country: null, lang: "ar", rest: parts[1] === "home" ? "" : parts.slice(1).join("/") };
  const cc = BY_FIRST[parts[0]];
  if (!cc) return { country: null, lang: "en", rest: parts.join("/") };
  const country = COUNTRIES[cc];
  const second = parts[1];
  // The second segment is a language only when it is one of the country's
  // non-default languages ("ae/ar", "sa/ar"); otherwise it is a page.
  const isLang = !!second && country.languages.includes(second as Lang) && second !== country.languages[0];
  const lang = isLang ? (second as Lang) : country.languages[0];
  return { country: cc, lang, rest: parts.slice(isLang ? 2 : 1).join("/") };
}

/** A root-tenant page's address: the language homes have short paths. */
export function rootPathOf(slug: string): string {
  return slug === "home" ? "/" : slug === "bn/home" ? "/bn" : slug === "ar/home" ? "/ar" : `/${slug}`;
}

/** Path of a country page in a language, with an optional sub page. */
export function countryPath(cc: CountryCode, lang: Lang, rest = ""): string | null {
  const base = COUNTRIES[cc].paths[lang];
  if (base === undefined) return null;
  return rest ? `${base}/${rest}` : base;
}

/** The language a root-tenant page is written in, from its slug alone. */
export function langForRootSlug(slug: string): Lang {
  return locateRootSlug(slug).lang;
}

/**
 * All hreflang alternates a root-tenant page should list, keyed by hreflang
 * code ("en-AE", "ar-SA", "bn-BD", "x-default"), values site-relative paths.
 *
 * `exists` says whether a root page is published at a slug; alternates whose
 * page is missing are left out so hreflang never points at a 404. Without it
 * every language of the page's own country is assumed to exist.
 */
export async function hreflangFor(slug: string, exists?: (slug: string) => Promise<boolean>): Promise<Record<string, string>> {
  const loc = locateRootSlug(slug);
  const has = async (s: string) => (exists ? exists(s) : true);
  const out: Record<string, string> = {};

  if (loc.country === null && loc.rest === "") {
    // Global "/" and "/bn": every country home is an alternate.
    out["x-default"] = "/";
    out["en"] = "/";
    if (await has("bn/home")) out["bn-BD"] = "/bn";
    if (await has("ar/home")) out["ar"] = "/ar";
    for (const cc of SALES_COUNTRIES) {
      const c = COUNTRIES[cc];
      for (const l of c.languages) {
        const p = c.paths[l]!;
        if (await has(p.slice(1))) out[c.hreflang[l]!] = p;
      }
    }
    return out;
  }

  if (loc.country === null) {
    // A plain root page ("pricing") or its Bangla twin ("bn/pricing").
    const en = `/${loc.rest}`;
    const bn = `/bn/${loc.rest}`;
    if (await has(loc.rest)) { out["x-default"] = en; out["en"] = en; }
    if (await has(`bn/${loc.rest}`)) out["bn-BD"] = bn;
    if (await has(`ar/${loc.rest}`)) out["ar"] = `/ar/${loc.rest}`;
    return out;
  }

  const c = COUNTRIES[loc.country];
  for (const l of c.languages) {
    const p = countryPath(loc.country, l, loc.rest)!;
    if (await has(p.slice(1))) out[c.hreflang[l]!] = p;
  }
  // x-default: the global English page with the same slug when there is one,
  // else the global home.
  out["x-default"] = loc.rest && (await has(loc.rest)) ? `/${loc.rest}` : "/";
  return out;
}

/**
 * The same alternates keyed by plain language ("en", "ar", "bn") for the
 * visitor-facing language switcher of ONE page: only this page's own
 * country (or the global page's en/bn pair), never the other countries.
 */
export function switcherAlternates(slug: string, hreflang: Record<string, string>): Record<string, string> {
  const loc = locateRootSlug(slug);
  const out: Record<string, string> = {};
  if (loc.country === null) {
    if (hreflang.en) out.en = hreflang.en;
    if (hreflang["bn-BD"]) out.bn = hreflang["bn-BD"];
    if (hreflang.ar) out.ar = hreflang.ar;
    return out;
  }
  const c = COUNTRIES[loc.country];
  for (const l of c.languages) {
    const p = hreflang[c.hreflang[l]!];
    if (p) out[l] = p;
  }
  return out;
}
