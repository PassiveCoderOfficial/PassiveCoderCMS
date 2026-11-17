"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, SALES_COUNTRIES, type CountryCode } from "@/lib/pricing/countries";

const T = {
  en: {
    shown: (cur: string, name: string) => `Prices shown in ${cur} for ${name}.`,
    notIn: (name: string) => `Not in ${name}?`,
    change: "Change country", other: "Other (USD)", cancel: "Cancel",
    visit: (name: string) => `See our ${name} page`,
  },
  bn: {
    shown: (cur: string, name: string) => `${name}-এর জন্য ${cur}-এ দাম দেখানো হচ্ছে।`,
    notIn: (name: string) => `${name}-তে নেই?`,
    change: "দেশ বদলান", other: "অন্য দেশ (USD)", cancel: "বাতিল",
    visit: (name: string) => `${name}-এর পেজ দেখুন`,
  },
};

const NAMES_BN: Partial<Record<CountryCode, string>> = {
  AE: "সংযুক্ত আরব আমিরাত", SA: "সৌদি আরব", QA: "কাতার", OM: "ওমান", SG: "সিঙ্গাপুর", MY: "মালয়েশিয়া", BD: "বাংলাদেশ", US: "অন্য দেশ",
};

/** "the UAE" reads better than "United Arab Emirates" mid-sentence. */
const SHORT: Partial<Record<CountryCode, string>> = { AE: "the UAE", US: "your country" };

/**
 * Thin notice above the global price grid: which country's prices are on
 * screen and a way to switch. The choice is stored in a cookie
 * (api/public/country) and the page re-renders with that country's prices.
 */
export function CountryBar({ country, currency, lang = "en", dark }: { country: CountryCode; currency: string; lang?: "en" | "bn"; dark?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const t = T[lang];
  const name = lang === "bn" ? NAMES_BN[country] ?? COUNTRIES[country].name : SHORT[country] ?? COUNTRIES[country].name;

  const choose = (code: string) => {
    start(async () => {
      await fetch("/api/public/country", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country: code }) });
      setOpen(false);
      router.refresh();
    });
  };

  const options: CountryCode[] = [...SALES_COUNTRIES, "BD", "US"];
  const label = (c: CountryCode) => (c === "US" ? t.other : lang === "bn" ? NAMES_BN[c] ?? COUNTRIES[c].name : COUNTRIES[c].name);

  return (
    <div className={`mb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 rounded-full border px-4 py-2 text-center text-xs sm:text-sm ${dark ? "border-white/10 bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-500"}`}>
      <span>{t.shown(currency, name)}</span>
      {SALES_COUNTRIES.includes(country) && COUNTRIES[country].paths.en && (
        <a href={COUNTRIES[country].paths.en} className="font-semibold text-orange-500 underline-offset-2 hover:underline">{t.visit(name.replace(/^the /, ""))}</a>
      )}
      {country !== "US" && <span>{t.notIn(name)}</span>}
      {open ? (
        <span className="inline-flex items-center gap-2">
          <select
            autoFocus
            disabled={pending}
            defaultValue=""
            onChange={(e) => e.target.value && choose(e.target.value)}
            className={`h-7 rounded-md border px-2 text-xs ${dark ? "border-white/15 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900"}`}
            aria-label={t.change}
          >
            <option value="" disabled>{t.change}</option>
            {options.filter((c) => c !== country).map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </select>
          <button type="button" onClick={() => setOpen(false)} className="underline-offset-2 hover:underline">{t.cancel}</button>
        </span>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="font-semibold text-orange-500 underline-offset-2 hover:underline">{t.change}</button>
      )}
    </div>
  );
}
