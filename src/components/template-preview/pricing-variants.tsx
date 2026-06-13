"use client";

import { Check } from "lucide-react";

interface PricingTier { name: string; price: string; period?: string; features: string[]; highlight?: boolean; cta: string }
interface PricingData { pricing: PricingTier[]; primaryColor: string; accentHex: string; secondaryColor: string }

// ── Variant 1: Highlighted cards (standard) ───────────────────────────────────
export function PricingHighlightCards({ d }: { d: PricingData }) {
  return (
    <section className="bg-gray-50 px-8 py-14">
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>Simple Pricing</div>
        <h2 className="text-2xl font-extrabold text-gray-900">Choose Your Plan</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {d.pricing.map(tier => (
          <div
            key={tier.name}
            className={`rounded-2xl p-6 border-2 relative ${tier.highlight ? "shadow-xl" : "bg-white border-gray-200"}`}
            style={tier.highlight ? { borderColor: d.accentHex, backgroundColor: `${d.accentHex}06` } : {}}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: d.accentHex }}>
                Most Popular
              </div>
            )}
            <div className="font-bold text-gray-900 mb-1">{tier.name}</div>
            <div className="font-extrabold text-3xl mb-1" style={{ color: tier.highlight ? d.accentHex : "#111" }}>{tier.price}</div>
            {tier.period && <div className="text-xs text-gray-400 mb-4">{tier.period}</div>}
            <ul className="space-y-2 mb-6">
              {tier.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" /> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full text-center text-sm font-bold py-2.5 rounded-xl cursor-pointer"
              style={tier.highlight ? { backgroundColor: d.accentHex, color: "#fff" } : { border: `2px solid ${d.accentHex}`, color: d.accentHex }}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Variant 2: Horizontal compare table ──────────────────────────────────────
export function PricingTable({ d }: { d: PricingData }) {
  return (
    <section className="bg-white px-8 py-14 border-y border-gray-100">
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>Packages</div>
        <h2 className="text-2xl font-extrabold text-gray-900">What&apos;s Included</h2>
      </div>
      <div className="max-w-4xl mx-auto border border-gray-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
          <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Features</div>
          {d.pricing.slice(0, 3).map(tier => (
            <div key={tier.name} className="p-4 text-center" style={tier.highlight ? { backgroundColor: `${d.accentHex}10` } : {}}>
              <div className="font-bold text-sm text-gray-900">{tier.name}</div>
              <div className="font-extrabold text-lg mt-1" style={{ color: tier.highlight ? d.accentHex : "#374151" }}>{tier.price}</div>
            </div>
          ))}
        </div>
        {(d.pricing[0]?.features ?? []).map((f, i) => (
          <div key={f} className={`grid grid-cols-4 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} border-b border-gray-100 last:border-0`}>
            <div className="p-3 text-xs text-gray-600 font-medium">{f}</div>
            {d.pricing.slice(0, 3).map(tier => (
              <div key={tier.name} className="p-3 flex justify-center" style={tier.highlight ? { backgroundColor: `${d.accentHex}05` } : {}}>
                {i < tier.features.length
                  ? <Check className="w-4 h-4 text-green-500" />
                  : <span className="text-gray-200 text-sm">—</span>}
              </div>
            ))}
          </div>
        ))}
        <div className="grid grid-cols-4 bg-gray-50 border-t border-gray-200 p-3 gap-2">
          <div />
          {d.pricing.slice(0, 3).map(tier => (
            <div key={tier.name} className="flex justify-center">
              <button
                className="text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                style={tier.highlight ? { backgroundColor: d.accentHex, color: "#fff" } : { border: `1.5px solid ${d.accentHex}`, color: d.accentHex }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 3: Dark background pricing (corporate/B2B) ────────────────────────
export function PricingDark({ d }: { d: PricingData }) {
  return (
    <section style={{ backgroundColor: d.primaryColor }} className="px-8 py-14">
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2 text-white/50">Pricing</div>
        <h2 className="text-2xl font-extrabold text-white">Investment Plans</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {d.pricing.map(tier => (
          <div
            key={tier.name}
            className="rounded-xl p-6 border"
            style={tier.highlight
              ? { backgroundColor: d.accentHex, borderColor: d.accentHex }
              : { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)" }}
          >
            <div className="font-bold text-sm mb-1" style={{ color: tier.highlight ? "#000" : "rgba(255,255,255,0.7)" }}>{tier.name}</div>
            <div className="font-extrabold text-2xl mb-4" style={{ color: tier.highlight ? "#000" : "#fff" }}>{tier.price}</div>
            <ul className="space-y-2 mb-5">
              {tier.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs" style={{ color: tier.highlight ? "#000" : "rgba(255,255,255,0.6)" }}>
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full text-center text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              style={tier.highlight
                ? { backgroundColor: "#000", color: d.accentHex }
                : { border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff" }}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
