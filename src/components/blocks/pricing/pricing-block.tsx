import React from "react";
import type { PricingBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function PricingBlock({ block }: { block: PricingBlockProps }) {
  const { data } = block;
  const { title, subtitle, plans } = data;

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn(
        "grid gap-8",
        plans.length === 1 && "max-w-sm mx-auto",
        plans.length === 2 && "sm:grid-cols-2",
        plans.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
      )}>
        {plans.map(plan => (
          <div key={plan.id} className={cn(
            "relative flex flex-col rounded-2xl border p-8",
            plan.highlighted
              ? "border-primary bg-primary text-primary-foreground shadow-xl lg:scale-105"
              : "border-border bg-white shadow-sm",
          )}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              {plan.description && <p className={cn("text-sm", plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.description}</p>}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && <span className={cn("text-sm ml-1", plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>/{plan.period}</span>}
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className={cn("w-4 h-4 shrink-0 mt-0.5", plan.highlighted ? "text-primary-foreground" : "text-primary")} />
                  {f}
                </li>
              ))}
            </ul>
            {plan.ctaLabel && (
              <a href={plan.ctaUrl ?? "#"} className={cn(
                "block text-center py-3 rounded-lg font-semibold text-sm transition-colors",
                plan.highlighted
                  ? "bg-white text-primary hover:bg-white/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}>
                {plan.ctaLabel}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
