"use client";

import React, { useState, useEffect } from "react";
import type { PricingBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// ─── Currency helpers ─────────────────────────────────────────────────────────

type Currency = "USD" | "BDT";

function formatPrice(plan: PricingBlockProps["data"]["plans"][number], currency: Currency, bdtRate: number): string {
  if (!plan.priceUsdCents) return plan.price;
  if (currency === "USD") return `$${(plan.priceUsdCents / 100).toLocaleString("en-US")}`;
  const bdt = Math.round((plan.priceUsdCents / 100) * bdtRate);
  return `৳${bdt.toLocaleString("en-BD")}`;
}

function CurrencyToggle({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1 text-sm font-medium">
        <button
          onClick={() => onChange("USD")}
          className={cn(
            "px-4 py-1.5 rounded-full transition-all",
            currency === "USD" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          USD $
        </button>
        <button
          onClick={() => onChange("BDT")}
          className={cn(
            "px-4 py-1.5 rounded-full transition-all",
            currency === "BDT" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          BDT ৳
        </button>
      </div>
    </div>
  );
}

// ─── Feature list (shared) ────────────────────────────────────────────────────

type Plan = PricingBlockProps["data"]["plans"][number] & { displayPrice: string };

function FeatureList({ features, highlighted, dark }: { features: string[]; highlighted?: boolean; dark?: boolean }) {
  return (
    <ul className="space-y-3 flex-1 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Check className={cn("w-4 h-4 shrink-0 mt-0.5",
            highlighted ? "text-primary-foreground" : dark ? "text-primary" : "text-primary"
          )} />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Variants ─────────────────────────────────────────────────────────────────

type VariantData = PricingBlockProps["data"] & { plans: Plan[] };

function PricingHighlightedCards({ data }: { data: VariantData }) {
  return (
    <div className="max-w-6xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-lg text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-8", data.plans.length === 2 && "sm:grid-cols-2", data.plans.length >= 3 && "sm:grid-cols-3")}>
        {data.plans.map(plan => (
          <div key={plan.id} className={cn(
            "relative flex flex-col rounded-2xl border p-8 transition-all",
            plan.highlighted
              ? "border-primary bg-primary text-primary-foreground shadow-2xl lg:scale-105"
              : "border-border bg-card shadow-sm hover:shadow-md",
          )}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
              </div>
            )}
            <div className="mb-5">
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              {plan.description && <p className={cn("text-sm", plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.description}</p>}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.displayPrice}</span>
              {plan.period && <span className={cn("text-sm ml-1", plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.period}</span>}
            </div>
            <FeatureList features={plan.features} highlighted={plan.highlighted} />
            {plan.ctaLabel && (
              <a href={plan.ctaUrl ?? "#"} className={cn(
                "block text-center py-3 rounded-lg font-semibold text-sm transition-colors",
                plan.highlighted ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:opacity-90",
              )}>{plan.ctaLabel}</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingMinimalDark({ data }: { data: VariantData }) {
  return (
    <div className="max-w-6xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.title && <h2 className="text-3xl font-light mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-sm text-muted-foreground tracking-widest uppercase">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-6", data.plans.length === 2 && "sm:grid-cols-2", data.plans.length >= 3 && "sm:grid-cols-3")}>
        {data.plans.map(plan => (
          <div key={plan.id} className={cn(
            "flex flex-col p-8 border",
            plan.highlighted ? "border-primary bg-card" : "border-border bg-card",
          )}>
            {plan.badge && <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-3">{plan.badge}</span>}
            <h3 className="text-xl font-light mb-1">{plan.name}</h3>
            {plan.description && <p className="text-xs text-muted-foreground mb-5">{plan.description}</p>}
            <div className="mb-6 border-t border-border pt-5">
              <span className={cn("text-3xl font-semibold", plan.highlighted && "text-primary")}>{plan.displayPrice}</span>
              {plan.period && <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>}
            </div>
            <FeatureList features={plan.features} />
            {plan.ctaLabel && (
              <a href={plan.ctaUrl ?? "#"} className={cn(
                "block text-center py-3 text-sm font-medium transition-colors",
                plan.highlighted ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border hover:border-primary text-foreground",
              )}>{plan.ctaLabel}</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingDarkCards({ data }: { data: VariantData }) {
  return (
    <div className="max-w-6xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.title && <h2 className="text-3xl font-black mb-3 tracking-tight">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-6", data.plans.length === 2 && "sm:grid-cols-2", data.plans.length >= 3 && "sm:grid-cols-3")}>
        {data.plans.map(plan => (
          <div key={plan.id} className={cn(
            "relative flex flex-col rounded-xl p-8",
            plan.highlighted
              ? "bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/50 shadow-xl shadow-primary/20"
              : "bg-card border border-border",
          )}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
              </div>
            )}
            <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
            {plan.description && <p className="text-xs text-muted-foreground mb-5">{plan.description}</p>}
            <div className="mb-6">
              <span className={cn("text-4xl font-black", plan.highlighted && "text-primary")}>{plan.displayPrice}</span>
              {plan.period && <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>}
            </div>
            <FeatureList features={plan.features} dark />
            {plan.ctaLabel && (
              <a href={plan.ctaUrl ?? "#"} className={cn(
                "block text-center py-3 rounded-lg font-bold text-sm transition-all",
                plan.highlighted ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border hover:border-primary text-foreground",
              )}>{plan.ctaLabel}</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingMenuPricing({ data }: { data: VariantData }) {
  return (
    <div className="max-w-4xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.title && <h2 className="text-3xl font-bold italic mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-6", data.plans.length >= 2 && "sm:grid-cols-2", data.plans.length >= 3 && "lg:grid-cols-3")}>
        {data.plans.map(plan => (
          <div key={plan.id} className={cn(
            "flex flex-col p-8 border rounded-xl",
            plan.highlighted ? "border-primary bg-primary/5" : "border-border bg-card",
          )}>
            {plan.badge && <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{plan.badge}</span>}
            <h3 className="text-xl font-semibold italic mb-1">{plan.name}</h3>
            {plan.description && <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>}
            <div className="text-3xl font-bold text-primary mb-1">{plan.displayPrice}</div>
            {plan.period && <p className="text-xs text-muted-foreground mb-6">{plan.period}</p>}
            <ul className="space-y-2 flex-1 mb-8 text-sm">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✦</span>
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
            {plan.ctaLabel && (
              <a href={plan.ctaUrl ?? "#"} className={cn(
                "block text-center py-3 rounded-lg font-semibold text-sm transition-all",
                plan.highlighted ? "bg-primary text-primary-foreground hover:opacity-90" : "border-2 border-primary text-primary hover:bg-primary/10",
              )}>{plan.ctaLabel}</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingMembershipCards({ data }: { data: VariantData }) {
  return (
    <div className="max-w-6xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="mb-10">
          {data.title && <h2 className="text-3xl font-black uppercase tracking-tight mb-2">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-5", data.plans.length === 2 && "sm:grid-cols-2", data.plans.length >= 3 && "sm:grid-cols-3")}>
        {data.plans.map(plan => (
          <div key={plan.id} className={cn(
            "flex flex-col border-t-4 p-8",
            plan.highlighted ? "border-t-primary bg-card border border-primary/30" : "border-t-border bg-card border border-border",
          )}>
            {plan.badge && <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">{plan.badge}</span>}
            <h3 className="text-xl font-black uppercase tracking-wide mb-1">{plan.name}</h3>
            {plan.description && <p className="text-xs text-muted-foreground mb-5">{plan.description}</p>}
            <div className="mb-6">
              <span className={cn("text-4xl font-black", plan.highlighted && "text-primary")}>{plan.displayPrice}</span>
              {plan.period && <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>}
            </div>
            <FeatureList features={plan.features} dark />
            {plan.ctaLabel && (
              <a href={plan.ctaUrl ?? "#"} className={cn(
                "block text-center py-3 font-black text-sm uppercase tracking-wide transition-all",
                plan.highlighted ? "bg-primary text-primary-foreground hover:opacity-90" : "border-2 border-border hover:border-primary text-foreground",
              )}>{plan.ctaLabel}</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingLegacy({ data }: { data: VariantData }) {
  return (
    <div className="max-w-6xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-lg text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-8", data.plans.length === 2 && "sm:grid-cols-2", data.plans.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3")}>
        {data.plans.map(plan => (
          <div key={plan.id} className={cn(
            "relative flex flex-col rounded-2xl border p-8",
            plan.highlighted ? "border-primary bg-primary text-primary-foreground shadow-xl lg:scale-105" : "border-border bg-white shadow-sm",
          )}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              {plan.description && <p className={cn("text-sm", plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.description}</p>}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.displayPrice}</span>
              {plan.period && <span className={cn("text-sm ml-1", plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.period}</span>}
            </div>
            <FeatureList features={plan.features} highlighted={plan.highlighted} />
            {plan.ctaLabel && (
              <a href={plan.ctaUrl ?? "#"} className={cn(
                "block text-center py-3 rounded-lg font-semibold text-sm transition-colors",
                plan.highlighted ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}>{plan.ctaLabel}</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function PricingBlock({ block }: { block: PricingBlockProps }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [bdtRate, setBdtRate] = useState(125);

  const showToggle = block.data.showCurrencyToggle &&
    block.data.plans.some(p => p.priceUsdCents != null);

  useEffect(() => {
    if (!showToggle) return;
    fetch("/api/public/currency-rate")
      .then(r => r.json())
      .then((d: { rate?: number }) => { if (d.rate) setBdtRate(d.rate); })
      .catch(() => {});
  }, [showToggle]);

  const variantData: VariantData = {
    ...block.data,
    plans: block.data.plans.map(p => ({
      ...p,
      displayPrice: formatPrice(p, currency, bdtRate),
    })),
  };

  const variant = block.templateVariant;

  return (
    <div>
      {showToggle && <CurrencyToggle currency={currency} onChange={setCurrency} />}
      {variant === "highlighted-cards" && <PricingHighlightedCards data={variantData} />}
      {variant === "minimal-dark" && <PricingMinimalDark data={variantData} />}
      {variant === "dark-cards" && <PricingDarkCards data={variantData} />}
      {variant === "menu-pricing" && <PricingMenuPricing data={variantData} />}
      {variant === "membership-cards" && <PricingMembershipCards data={variantData} />}
      {!variant && <PricingLegacy data={variantData} />}
    </div>
  );
}
