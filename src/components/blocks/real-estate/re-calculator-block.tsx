"use client";

import React, { useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import type { ReCalculatorBlockProps } from "@/types/cms";
import { formatMoney } from "@/lib/real-estate/format";
import { SectionHeading } from "./shared";

function Field({ label, value, onChange, suffix, step = 1, min = 0, max }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; step?: number; min?: number; max?: number }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5 relative">
        <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ""} step={step} min={min} max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-11 pl-3.5 pr-14 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {max != null && (
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full mt-2 accent-[hsl(var(--primary))]" />
      )}
    </label>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide opacity-75">{label}</p>
      <p className={`${big ? "text-3xl sm:text-4xl" : "text-lg"} font-bold mt-0.5`}>{value}</p>
    </div>
  );
}

/** Mortgage and rental-yield calculators. Pure client maths, no data. */
export function ReCalculatorBlock({ block }: { block: ReCalculatorBlockProps }) {
  const { data } = block;
  const cur = data.currency || "SAR";
  const mode = data.mode ?? "both";
  const [tab, setTab] = useState<"mortgage" | "roi">(mode === "roi" ? "roi" : "mortgage");

  const [price, setPrice] = useState(data.defaultPrice ?? 2_000_000);
  const [downPct, setDownPct] = useState(data.defaultDownPct ?? 20);
  const [rate, setRate] = useState(data.defaultRate ?? 5.5);
  const [years, setYears] = useState(data.defaultYears ?? 25);

  const [rent, setRent] = useState(Math.round((data.defaultPrice ?? 2_000_000) * 0.07));
  const [costs, setCosts] = useState(Math.round((data.defaultPrice ?? 2_000_000) * 0.01));
  const [occupancy, setOccupancy] = useState(92);

  const loan = Math.max(price * (1 - downPct / 100), 0);
  const r = rate / 100 / 12;
  const n = years * 12;
  const monthly = n > 0 ? (r > 0 ? (loan * r) / (1 - Math.pow(1 + r, -n)) : loan / n) : 0;
  const totalInterest = monthly * n - loan;

  const effectiveRent = rent * (occupancy / 100);
  const gross = price > 0 ? (rent / price) * 100 : 0;
  const net = price > 0 ? ((effectiveRent - costs) / price) * 100 : 0;
  const payback = effectiveRent - costs > 0 ? price / (effectiveRent - costs) : 0;

  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        {mode === "both" && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-full border bg-card p-1">
              <button type="button" onClick={() => setTab("mortgage")} className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${tab === "mortgage" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Calculator className="w-4 h-4" />Mortgage</button>
              <button type="button" onClick={() => setTab("roi")} className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${tab === "roi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><TrendingUp className="w-4 h-4" />Rental yield</button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-[1.2fr_1fr] bg-card border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 space-y-5">
            <Field label="Property price" value={price} onChange={setPrice} suffix={cur} step={50_000} />
            {tab === "mortgage" ? (
              <>
                <Field label="Down payment" value={downPct} onChange={setDownPct} suffix="%" min={0} max={80} />
                <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.1} min={0} max={12} />
                <Field label="Loan term" value={years} onChange={setYears} suffix="years" min={1} max={30} />
              </>
            ) : (
              <>
                <Field label="Annual rent" value={rent} onChange={setRent} suffix={cur} step={5_000} />
                <Field label="Annual costs (service charge, maintenance)" value={costs} onChange={setCosts} suffix={cur} step={1_000} />
                <Field label="Occupancy" value={occupancy} onChange={setOccupancy} suffix="%" min={40} max={100} />
              </>
            )}
          </div>
          <div className="p-6 sm:p-8 bg-primary text-primary-foreground flex flex-col justify-center gap-6">
            {tab === "mortgage" ? (
              <>
                <Stat big label="Monthly payment" value={formatMoney(monthly, cur)} />
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Down payment" value={formatMoney(price - loan, cur, true)} />
                  <Stat label="Loan amount" value={formatMoney(loan, cur, true)} />
                  <Stat label="Total interest" value={formatMoney(Math.max(totalInterest, 0), cur, true)} />
                  <Stat label="Total cost" value={formatMoney(price + Math.max(totalInterest, 0), cur, true)} />
                </div>
              </>
            ) : (
              <>
                <Stat big label="Net yield" value={`${net.toFixed(2)}%`} />
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Gross yield" value={`${gross.toFixed(2)}%`} />
                  <Stat label="Net income / yr" value={formatMoney(Math.max(effectiveRent - costs, 0), cur, true)} />
                  <Stat label="Payback" value={payback ? `${payback.toFixed(1)} yrs` : "—"} />
                  <Stat label="Monthly net" value={formatMoney(Math.max((effectiveRent - costs) / 12, 0), cur, true)} />
                </div>
              </>
            )}
            <p className="text-[11px] opacity-70">Estimates for guidance only. Rates and eligibility vary by bank and residency status.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
