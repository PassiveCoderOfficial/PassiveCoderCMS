"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CurrencySettings {
  currency: string;
  currency_symbol: string;
  currency_position: "before" | "after";
}

// Module-level cache so all components on a page share one fetch
let _cache: CurrencySettings | null = null;
let _promise: Promise<CurrencySettings> | null = null;

async function fetchCurrencySettings(): Promise<CurrencySettings> {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = createClient()
    .from("ecommerce_settings")
    .select("currency, currency_symbol, currency_position")
    .single()
    .then(({ data }) => {
      const result: CurrencySettings = {
        currency: data?.currency ?? "USD",
        currency_symbol: data?.currency_symbol ?? "$",
        currency_position: (data?.currency_position as "before" | "after") ?? "before",
      };
      _cache = result;
      return result;
    });
  return _promise;
}

const DEFAULT: CurrencySettings = { currency: "USD", currency_symbol: "$", currency_position: "before" };

export function useEcommerceCurrency() {
  const [settings, setSettings] = useState<CurrencySettings>(_cache ?? DEFAULT);

  useEffect(() => {
    if (_cache) { setSettings(_cache); return; }
    fetchCurrencySettings().then(setSettings);
  }, []);

  function format(amount: number): string {
    const { currency, currency_symbol, currency_position } = settings;
    try {
      // Use Intl for number formatting with the correct currency
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
      }).format(amount);
      // Replace the default symbol with the stored one (handles BDT ৳ etc.)
      // Intl may render "BDT" as "BDT" text — replace with our symbol
      const withSymbol = formatted.replace(/[A-Z]{3}|[^\d.,\s-]/g, (match) => {
        // If it's the 3-letter currency code fallback, replace with our symbol
        if (match === currency) return currency_symbol;
        // Otherwise keep (commas, dots, digits, minus)
        return match;
      });
      // Handle position override for "after" currencies
      if (currency_position === "after") {
        const num = new Intl.NumberFormat("en-US").format(amount);
        return `${num}${currency_symbol}`;
      }
      return withSymbol;
    } catch {
      // Fallback for unknown currency codes
      const num = new Intl.NumberFormat("en-US").format(amount);
      return currency_position === "after"
        ? `${num}${currency_symbol}`
        : `${currency_symbol}${num}`;
    }
  }

  return { ...settings, format };
}
