"use client";

import { useEffect, useRef, useState } from "react";
import { DISPLAY_CODES, FALLBACK_RATES, currencyForCountry, type DisplayCode, type PriceCurrency } from "@/lib/currency/display";

type Geo = { country: string | null; rates: Record<DisplayCode, number> };

const KEY = "pc_currency";
const EVENT = "pc-currency";
let geo: Promise<Geo> | null = null;
const loadGeo = () =>
  (geo ??= fetch("/api/public/fx").then((r) => r.json() as Promise<Geo>).catch(() => ({ country: null, rates: FALLBACK_RATES })));

function stored(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/**
 * The currency every price block on the page shows, shared across blocks
 * and visits (choose once, every table follows).
 *
 * `bdtPage`: a Bangla or Bangladesh page, where taka is the page's own plan
 * and the default. Elsewhere taka is offered only to visitors in
 * Bangladesh; everyone else picks among converted display currencies.
 */
export function useDisplayCurrency({ bdtPage, hasBdt = true }: { bdtPage: boolean; hasBdt?: boolean }) {
  const [currency, setCurrency] = useState<PriceCurrency>(bdtPage && hasBdt ? "BDT" : "USD");
  const [country, setCountry] = useState<string | null>(null);
  const countryRef = useRef<string | null>(null);
  const [rates, setRates] = useState<Record<DisplayCode, number>>(FALLBACK_RATES);
  const bdtOffered = hasBdt && (bdtPage || country === "BD");
  const options: PriceCurrency[] = bdtOffered ? ["BDT", ...DISPLAY_CODES] : DISPLAY_CODES;

  useEffect(() => {
    let live = true;
    loadGeo().then((g) => {
      if (!live) return;
      setCountry(g.country);
      countryRef.current = g.country;
      setRates(g.rates);
      const offered = hasBdt && (bdtPage || g.country === "BD");
      const valid = (c: string | null): c is PriceCurrency => !!c && ((DISPLAY_CODES as string[]).includes(c) || (c === "BDT" && offered));
      const saved = stored();
      if (bdtPage && hasBdt) setCurrency(saved === "USD" ? "USD" : "BDT");
      else if (valid(saved)) setCurrency(saved);
      else { const own = currencyForCountry(g.country); setCurrency(valid(own) ? own : "USD"); }
    });
    const on = (e: Event) => {
      const c = (e as CustomEvent<string>).detail;
      if ((DISPLAY_CODES as string[]).includes(c) || (c === "BDT" && hasBdt && (bdtPage || countryRef.current === "BD"))) setCurrency(c as PriceCurrency);
    };
    window.addEventListener(EVENT, on);
    return () => { live = false; window.removeEventListener(EVENT, on); };
  }, [bdtPage, hasBdt]);

  const choose = (c: PriceCurrency) => {
    setCurrency(c);
    try { localStorage.setItem(KEY, c); } catch { /* private mode */ }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: c }));
  };

  return { currency, choose, options, rates, country };
}
