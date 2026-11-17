"use client";

import { Globe } from "lucide-react";
import type { PriceCurrency } from "@/lib/currency/display";

const T = {
  en: {
    label: "Currency", bdt: "BDT ৳ · Bangladesh price",
    converted: (c: string) => `Shown in ${c} at today's rate. You pay the USD price.`,
    bdtNote: "Bangladesh pricing in taka, for Bangladeshi business owners. Pay by bKash, Nagad or a Bangladesh bank.",
  },
  bn: {
    label: "মুদ্রা", bdt: "৳ টাকা · বাংলাদেশি প্রাইস",
    converted: (c: string) => `আজকের রেটে ${c}-তে দেখানো হচ্ছে। পেমেন্ট হবে USD মূল্যে।`,
    bdtNote: "বাংলাদেশি ব্যবসায়ীদের জন্য টাকায় বিশেষ প্রাইস। পেমেন্ট বিকাশ, নগদ বা বাংলাদেশি ব্যাংকে।",
  },
};

/** Currency picker for price blocks, with one honest line on what the
 *  shown price means. A native select: right on phones, no extra JS. */
export function CurrencySelect({ value, options, onChange, lang = "en", dark = false }: {
  value: PriceCurrency; options: PriceCurrency[]; onChange: (c: PriceCurrency) => void; lang?: "en" | "bn"; dark?: boolean;
}) {
  const t = T[lang];
  const note = value === "BDT" ? t.bdtNote : value === "USD" ? null : t.converted(value);
  return (
    <div className="flex flex-col items-center gap-2">
      <label className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${dark ? "border-white/15 bg-white/[0.06] text-white" : "border-slate-200 bg-white text-slate-900 shadow-sm"}`}>
        <Globe className="w-4 h-4 opacity-60" aria-hidden />
        <span className="sr-only">{t.label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value as PriceCurrency)} className="bg-transparent font-semibold outline-none cursor-pointer pr-1">
          {options.map((c) => <option key={c} value={c} className="text-slate-900">{c === "BDT" ? t.bdt : c}</option>)}
        </select>
      </label>
      {note && <p className={`text-xs max-w-md text-center ${dark ? "text-slate-400" : "text-slate-500"}`}>{note}</p>}
    </div>
  );
}
