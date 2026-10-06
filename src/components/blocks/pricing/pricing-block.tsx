"use client";

import React, { useState, useEffect } from "react";
import type { PricingBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ScHeading, ScMeter, WaIcon, scStyle, isExternal } from "@/components/blocks/_primitives/showcase";
import { useSiteContact, waLink } from "@/components/site/site-contact-context";

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

type VariantData = Omit<PricingBlockProps["data"], "plans"> & { plans: Plan[] };

function PricingHighlightedCards({ data }: { data: VariantData }) {
  return (
    <div className={cn("mx-auto", data.plans.length >= 4 ? "max-w-7xl" : "max-w-6xl")}>
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-lg text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid", data.plans.length >= 4 ? "gap-6 sm:grid-cols-2 lg:grid-cols-4" : "gap-8", data.plans.length === 2 && "sm:grid-cols-2", data.plans.length === 3 && "sm:grid-cols-3")}>
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
                plan.highlighted ? "bg-background text-foreground hover:bg-background/90" : "bg-primary text-primary-foreground hover:opacity-90",
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

// Full-bleed brand-color band, glass cards, black highlighted tier —
// manufacturing/corporate/B2B.
function PricingDark({ data }: { data: VariantData }) {
  return (
    <div className="w-full bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {(data.title || data.subtitle) && (
          <div className="text-center mb-8">
            {data.subtitle && <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-primary-foreground/50">{data.subtitle}</p>}
            {data.title && <h2 className="text-2xl font-extrabold text-primary-foreground">{data.title}</h2>}
          </div>
        )}
        <div className={cn("grid gap-5", data.plans.length === 2 && "sm:grid-cols-2", data.plans.length >= 3 && "sm:grid-cols-3")}>
          {data.plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl p-6 border",
                plan.highlighted ? "bg-primary-foreground border-primary-foreground" : "bg-primary-foreground/10 border-primary-foreground/15",
              )}
            >
              <div className={cn("font-bold text-sm mb-1", plan.highlighted ? "text-primary/70" : "text-primary-foreground/70")}>{plan.name}</div>
              <div className={cn("font-extrabold text-2xl mb-4", plan.highlighted ? "text-primary" : "text-primary-foreground")}>
                {plan.displayPrice}
                {plan.period && <span className="text-xs font-normal opacity-70 ml-1">{plan.period}</span>}
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className={cn("flex items-start gap-2 text-xs", plan.highlighted ? "text-primary/70" : "text-primary-foreground/60")}>
                    <Check className="w-3 h-3 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {plan.ctaLabel && (
                <a
                  href={plan.ctaUrl ?? "#"}
                  className={cn(
                    "text-center text-xs font-bold py-2.5 rounded-lg transition-opacity hover:opacity-90",
                    plan.highlighted ? "bg-primary text-primary-foreground" : "border border-primary-foreground/30 text-primary-foreground",
                  )}
                >
                  {plan.ctaLabel}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Spec cards: old/new price, spec line, % meter bars, included/excluded list,
// WhatsApp-prefilled buttons; the highlighted plan becomes the dark "top" card.
function PricingSpecCards({ data }: { data: VariantData }) {
  const contact = useSiteContact();
  const n = data.plans.length;
  const ctaFor = (plan: Plan) => {
    if (data.whatsappCta) {
      const text = (data.whatsappText || "Hi, I am interested in the {plan} package ({price}).")
        .replace(/\{plan\}/g, plan.name).replace(/\{price\}/g, `${data.currencyPrefix ?? ""}${plan.displayPrice}`);
      const href = waLink(contact.whatsapp || contact.phone, text);
      if (href) return href;
    }
    return plan.ctaUrl || "#";
  };
  return (
    <div className="sc-root max-w-6xl mx-auto" style={scStyle(data.colors)}>
      <ScHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
      <div className={cn("grid gap-6", n >= 2 && "sm:grid-cols-2", n >= 3 && "lg:grid-cols-3", n === 4 && "xl:grid-cols-4")}>
        {data.plans.map((plan) => {
          const top = !!plan.highlighted;
          const href = ctaFor(plan);
          return (
            <article key={plan.id} data-reveal className={cn(
              "relative flex flex-col gap-3.5 rounded-[calc(var(--radius)+10px)] border p-6 transition-all hover:-translate-y-1",
              top ? "sc-dark-grad sc-on-dark border-transparent text-white shadow-2xl" : "bg-card border-border hover:shadow-xl",
            )}>
              {plan.badge && <span className="sc-grad absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.14em] text-white">{plan.badge}</span>}
              <header className="flex items-center justify-between gap-2">
                <h3 className={cn("text-xl font-extrabold", top ? "text-white" : "text-foreground")}>{plan.name}</h3>
                {plan.tag && <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em]", top ? "bg-white/10 sc-accent" : "bg-primary/10 text-primary")}>{plan.tag}</span>}
              </header>
              <div className="flex items-baseline gap-3 flex-wrap">
                {plan.oldPrice && <s className={cn("text-sm", top ? "text-white/45" : "text-muted-foreground/70")}>{data.currencyPrefix}{plan.oldPrice}</s>}
                <strong className={cn("text-5xl font-extrabold leading-none", top ? "text-white" : "text-foreground")} style={{ fontFamily: "var(--heading-font)" }}>
                  {data.currencyPrefix && <small className="text-lg mr-1">{data.currencyPrefix}</small>}{plan.displayPrice}
                </strong>
                {plan.period && <span className={cn("text-sm", top ? "text-white/60" : "text-muted-foreground")}>/{plan.period}</span>}
              </div>
              {plan.spec && <p className={cn("font-bold", top ? "sc-accent" : "text-primary")}>{plan.spec}</p>}
              {plan.description && <p className={cn("text-sm", top ? "text-white/70" : "text-muted-foreground")}>{plan.description}</p>}
              {!!plan.meters?.length && (
                <div className="grid gap-2.5">{plan.meters.map((m) => <ScMeter key={m.id} label={m.label} value={m.value} onDark={top} compact />)}</div>
              )}
              <ul className="grid gap-2 flex-1 my-1">
                {plan.features.map((f, i) => (
                  <li key={i} className={cn("flex items-center gap-2.5 text-sm", top ? "text-white/85" : "text-foreground/85")}>
                    <Check className={cn("w-4 h-4 shrink-0", top ? "sc-accent" : "text-primary")} />{f}
                  </li>
                ))}
                {(plan.excludedFeatures ?? []).map((f, i) => (
                  <li key={`x${i}`} className={cn("flex items-center gap-2.5 text-sm line-through decoration-1", top ? "text-white/35" : "text-muted-foreground/60")}>
                    <Check className="w-4 h-4 shrink-0 opacity-40" />{f}
                  </li>
                ))}
              </ul>
              {plan.ctaLabel && (
                <a href={href} {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={cn("sc-btn w-full", top ? "sc-btn-grad" : "sc-btn-ghost")}>
                  {data.whatsappCta && <WaIcon />}{plan.ctaLabel}
                </a>
              )}
            </article>
          );
        })}
      </div>
      {data.footnote && <p className="mt-7 text-center text-sm text-muted-foreground">{data.footnote}</p>}
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
            plan.highlighted ? "border-primary bg-primary text-primary-foreground shadow-xl lg:scale-105" : "border-border bg-card shadow-sm",
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
                plan.highlighted ? "bg-card text-primary hover:bg-card/90" : "bg-primary text-primary-foreground hover:bg-primary/90",
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
      {variant === "dark" && <PricingDark data={variantData} />}
      {variant === "spec-cards" && <PricingSpecCards data={variantData} />}
      {!variant && <PricingLegacy data={variantData} />}
    </div>
  );
}
