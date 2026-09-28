"use client";

import React from "react";
import { Check } from "lucide-react";
import type { ReLeadFormBlockProps } from "@/types/cms";
import { LeadForm } from "./shared";

/** Consultation / valuation / viewing request with an optional image and
 *  selling points beside it. Leads go to re_leads + CRM + agent email. */
export function ReLeadFormBlock({ block }: { block: ReLeadFormBlockProps }) {
  const { data } = block;
  const bullets = (data.bullets ?? []).filter(Boolean);
  const hasSide = !!data.image || bullets.length > 0;

  return (
    <section className="px-4">
      <div className={`max-w-6xl mx-auto grid gap-10 items-center ${hasSide ? "lg:grid-cols-2" : "max-w-2xl"}`}>
        {hasSide && (
          <div>
            {data.title && <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{data.title}</h2>}
            {data.subtitle && <p className="mt-4 text-muted-foreground text-lg">{data.subtitle}</p>}
            {bullets.length > 0 && (
              <ul className="mt-6 space-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-3"><span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span><span>{b}</span></li>
                ))}
              </ul>
            )}
            {data.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.image} alt="" className="mt-8 rounded-2xl w-full aspect-[16/10] object-cover object-[50%_20%]" />
            )}
          </div>
        )}
        <div className="bg-card border rounded-3xl p-6 sm:p-8 shadow-xl">
          {!hasSide && data.title && <h2 className="text-2xl font-bold mb-1 text-center">{data.title}</h2>}
          {!hasSide && data.subtitle && <p className="text-muted-foreground mb-6 text-center">{data.subtitle}</p>}
          <LeadForm kind={data.kind ?? "consultation"} submitLabel={data.submitLabel} successMessage={data.successMessage} showBudget={data.showBudget} />
        </div>
      </div>
    </section>
  );
}
