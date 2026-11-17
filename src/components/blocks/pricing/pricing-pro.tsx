import React from "react";
import { Check, Minus } from "lucide-react";
import type { PricingBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ProHeading, ProLink, proRoot } from "@/components/blocks/_primitives/pro";

type Plan = PricingBlockProps["data"]["plans"][number] & { displayPrice: string };
type Data = Omit<PricingBlockProps["data"], "plans"> & { plans: Plan[]; toolbar?: React.ReactNode; onDark?: boolean };

/**
 * Pricing "Pro Tiers": every plan in one row (up to four), price first.
 * Name and tag, large price with its period, one-line spec, the button, then
 * the checklist. The recommended plan gets a brand-colour border and its
 * badge; nothing is filled with the brand colour except that plan's button.
 */
export function PricingProTiers({ data }: { data: Data }) {
  const n = data.plans.length;
  const cols = n >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : n === 3 ? "md:grid-cols-3" : n === 2 ? "sm:grid-cols-2" : "";
  return (
    <section className={proRoot(!!data.onDark)}>
      <div className={cn("pcx-wrap", n === 2 && "!max-w-[56rem]", n === 1 && "!max-w-[28rem]")}>
        <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} align="center" />
        {data.toolbar && <div className="-mt-4 mb-8">{data.toolbar}</div>}
        <div className={cn("grid gap-4 lg:gap-5 items-stretch", cols)}>
          {data.plans.map((plan) => {
            const top = !!plan.highlighted;
            return (
              <article key={plan.id} className={cn("pcx-card relative flex flex-col p-6 sm:p-7")}
                style={top ? { borderColor: "var(--pcx-accent)", boxShadow: "0 0 0 1px var(--pcx-accent), 0 24px 48px -28px rgb(11 16 32 / .35)" } : undefined}>
                {plan.badge && (
                  <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--pcx-accent)", color: "var(--pcx-on-accent)" }}>{plan.badge}</span>
                )}
                <header className="flex items-center justify-between gap-2">
                  <h3 className="pcx-h3">{plan.name}</h3>
                  {plan.tag && <span className="pcx-chip !py-0.5 !text-xs">{plan.tag}</span>}
                </header>
                <p className="m-0 mt-5 flex items-baseline gap-2 flex-wrap">
                  {plan.oldPrice && <s className="text-sm" style={{ color: "var(--pcx-faint)" }}>{data.currencyPrefix}{plan.oldPrice}</s>}
                  <span className="text-[2.5rem] font-bold leading-none tracking-[-0.03em]" style={{ color: "var(--pcx-fg)" }}>{data.currencyPrefix}{plan.displayPrice}</span>
                  {plan.period && <span className="pcx-small">{plan.period}</span>}
                </p>
                {plan.spec && <p className="m-0 mt-3 text-[0.9375rem] font-semibold" style={{ color: "var(--pcx-fg)" }}>{plan.spec}</p>}
                {plan.description && <p className="pcx-small m-0 mt-2">{plan.description}</p>}
                {plan.ctaLabel && (
                  <ProLink href={plan.ctaUrl || "#"} className={cn("pcx-btn w-full mt-6", top ? "pcx-btn-primary" : "pcx-btn-outline")}>{plan.ctaLabel}</ProLink>
                )}
                <ul className="m-0 mt-6 p-0 pt-6 list-none grid gap-3 border-t flex-1 content-start" style={{ borderColor: "var(--pcx-line)" }}>
                  {plan.features.map((f, i) => (
                    <li key={i} className="pcx-small flex items-start gap-2.5">
                      <Check className="w-4 h-4 shrink-0 mt-[0.1875rem] pcx-accent-text" strokeWidth={2.5} aria-hidden />{f}
                    </li>
                  ))}
                  {(plan.excludedFeatures ?? []).map((f, i) => (
                    <li key={`x${i}`} className="pcx-small flex items-start gap-2.5" style={{ color: "var(--pcx-faint)" }}>
                      <Minus className="w-4 h-4 shrink-0 mt-[0.1875rem]" strokeWidth={2} aria-hidden />{f}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        {data.footnote && <p className="pcx-small mt-8 text-center mx-auto max-w-[44rem]">{data.footnote}</p>}
      </div>
    </section>
  );
}
