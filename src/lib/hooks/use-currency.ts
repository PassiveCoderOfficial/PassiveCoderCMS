"use client";

import { useState, useEffect } from "react";

export type Currency = "USD" | "BDT";

let cachedRate: number | null = null;

export function useCurrencyRate() {
  const [rate, setRate] = useState<number>(cachedRate ?? 125);

  useEffect(() => {
    if (cachedRate) { setRate(cachedRate); return; }
    fetch("/api/public/currency-rate")
      .then(r => r.json())
      .then((d: { rate?: number }) => {
        if (d.rate) { cachedRate = d.rate; setRate(d.rate); }
      })
      .catch(() => {});
  }, []);

  return rate;
}

/**
 * Format a USD amount, optionally falling back to a rate-based BDT conversion.
 * Prefer formatPrice() when a fixed BDT price is available.
 */
export function formatCurrency(usdAmount: number, currency: Currency, bdtRate: number): string {
  if (currency === "USD") return `$${usdAmount.toLocaleString("en-US")}`;
  const bdt = Math.round(usdAmount * bdtRate);
  return `৳${bdt.toLocaleString("en-BD")}`;
}

/**
 * Format an explicit per-currency price.
 * @param usdAmount  amount in USD (dollars, not cents)
 * @param bdtAmount  fixed BDT price (whole taka); falls back to usd×rate when null
 */
export function formatPrice(usdAmount: number, bdtAmount: number | null | undefined, currency: Currency, bdtRate: number): string {
  if (currency === "USD") return `$${usdAmount.toLocaleString("en-US")}`;
  const bdt = bdtAmount != null ? bdtAmount : Math.round(usdAmount * bdtRate);
  return `৳${bdt.toLocaleString("en-BD")}`;
}
