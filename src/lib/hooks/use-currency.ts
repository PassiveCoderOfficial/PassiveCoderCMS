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

export function formatCurrency(usdAmount: number, currency: Currency, bdtRate: number): string {
  if (currency === "USD") return `$${usdAmount.toLocaleString("en-US")}`;
  const bdt = Math.round(usdAmount * bdtRate);
  return `৳${bdt.toLocaleString("en-BD")}`;
}
