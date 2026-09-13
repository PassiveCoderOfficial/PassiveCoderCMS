"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Star, ArrowRight, Users, Zap, Plug, BookOpen, Users2, Receipt, Calculator, CreditCard, Mail, ShoppingCart } from "lucide-react";
import { CurrencyToggle } from "@/components/ui/currency-toggle";
import { useCurrencyRate, formatPrice, type Currency } from "@/lib/hooks/use-currency";

interface Plan {
  id: string;
  name: string;
  price_yearly: number;
  price_monthly: number;
  price_yearly_bdt: number | null;
  price_monthly_bdt: number | null;
  storage_gb: number;
  pages_limit: number;
  domains: number;
  support_tier: string;
  visitor_limit_monthly: number;
  overage_cents_per_1k: number;
  features: string[];
}

type Cycle = "monthly" | "yearly";

const ENM_INTEGRATIONS = [
  { icon: Users2,      label: "CRM",            desc: "Customer & lead management", note: "Forms → CRM via API" },
  { icon: BookOpen,    label: "Booking",         desc: "Appointments & scheduling",  note: "Widget embedded on site" },
  { icon: Calculator,  label: "Accounting",      desc: "Expenses, P&L, reports",     note: "Back-office on ENM" },
  { icon: Receipt,     label: "Invoicing",       desc: "Send & track invoices",       note: "Back-office on ENM" },
  { icon: CreditCard,  label: "Payments",        desc: "Online & in-person",          note: "POS lives on ENM" },
  { icon: Mail,        label: "Email Marketing", desc: "Campaigns & automations",     note: "Signup forms feed list" },
  { icon: ShoppingCart,label: "POS Sync",        desc: "In-person point of sale",     note: "Inventory syncs to CMS" },
];

export default function PricingSection({ plans }: { plans: Plan[] }) {
  const availableCycles = useMemo<Cycle[]>(() => {
    const cycles: Cycle[] = [];
    if (plans.some(p => (p.price_monthly ?? 0) > 0)) cycles.push("monthly");
    if (plans.some(p => (p.price_yearly ?? 0) > 0)) cycles.push("yearly");
    return cycles.length ? cycles : ["monthly"];
  }, [plans]);

  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [currency, setCurrency] = useState<Currency>("USD");
  const bdtRate = useCurrencyRate();

  const priceFor = (plan: Plan): number => {
    const cents = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
    return (cents ?? 0) / 100;
  };
  const bdtFor = (plan: Plan): number | null =>
    cycle === "monthly" ? (plan.price_monthly_bdt ?? null) : (plan.price_yearly_bdt ?? null);

  const suffix = cycle === "monthly" ? "/month" : "/year";

  const visiblePlans = plans.filter(p => p.id !== "custom");

  return (
    <section id="pricing" className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, honest pricing</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
            Everything your business needs online. No surprises.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-white/[0.05] text-slate-300 text-sm font-medium px-4 py-2 rounded-full border border-white/[0.08]">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Card, bKash &amp; Nagad accepted — cancel anytime
          </div>
        </div>

        {/* Billing toggle + currency toggle */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {availableCycles.length > 1 && (
            <div className="inline-flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-full p-1">
              <button
                onClick={() => setCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  cycle === "monthly" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  cycle === "yearly" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Yearly
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Save</span>
              </button>
            </div>
          )}
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>

        {/* Skeleton */}
        {!plans.length && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {["Basic", "Pro", "Integrations"].map(name => (
              <div key={name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 animate-pulse">
                <div className="h-5 w-24 bg-white/[0.06] rounded mb-4" />
                <div className="h-10 w-20 bg-white/[0.06] rounded mb-6" />
                {[1,2,3,4].map(i => <div key={i} className="h-4 bg-white/[0.06] rounded mb-3 w-full" />)}
                <div className="h-10 bg-white/[0.06] rounded mt-8" />
              </div>
            ))}
          </div>
        )}

        {/* Plan cards: Basic | Pro | Biz */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* ── Basic + Pro plan cards ── */}
          {visiblePlans.map((plan) => {
            const isPremium = plan.id === "pro";
            const price = priceFor(plan);
            const offersCycle = price > 0;
            const features: string[] = Array.isArray(plan.features)
              ? plan.features
              : JSON.parse(plan.features as unknown as string ?? "[]");
            const monthlyPrice  = (plan.price_monthly ?? 0) / 100;
            const yearlyPrice   = (plan.price_yearly  ?? 0) / 100;
            // Yearly is sold at a discount off 12x the monthly rate. Express it as a
            // percentage plus an effective monthly rate — an absolute "save $X" figure
            // reads as nonsense when the discount approaches the price itself.
            const yearlyPercentOff = monthlyPrice > 0 && yearlyPrice > 0
              ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 0;
            const yearlyEffectiveMonthly = yearlyPrice > 0 ? yearlyPrice / 12 : 0;
            // BDT equivalents (fixed prices) for the same figures
            const monthlyBdt = plan.price_monthly_bdt ?? null;
            const yearlyBdt  = plan.price_yearly_bdt ?? null;
            const yearlyEffectiveMonthlyBdt = yearlyBdt != null && yearlyBdt > 0
              ? Math.round(yearlyBdt / 12) : null;
            const visitorLimit = plan.visitor_limit_monthly ?? 0;
            const pagesLimit   = plan.pages_limit ?? -1;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  isPremium
                    ? "border-indigo-400/30 bg-gradient-to-b from-indigo-500/[0.08] to-transparent"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] transition-all"
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-white text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-current" /> Most Popular
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {offersCycle ? (
                    <>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">{formatPrice(price, bdtFor(plan), currency, bdtRate)}</span>
                        <span className="text-slate-500 text-sm">{suffix}</span>
                      </div>
                      {cycle === "yearly" && yearlyPercentOff > 0 && (
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                          4 months free — {formatPrice(yearlyEffectiveMonthly, yearlyEffectiveMonthlyBdt, currency, bdtRate)}/mo billed yearly
                        </p>
                      )}
                      {cycle === "monthly" && yearlyPrice > 0 && yearlyPercentOff > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Or {formatPrice(yearlyPrice, yearlyBdt, currency, bdtRate)}/yr — 4 months free
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mt-3">
                      <span className="text-xl font-bold text-slate-600">Not available {cycle}</span>
                    </div>
                  )}
                </div>

                {/* Visitor allowance */}
                {visitorLimit > 0 && (
                  <div className={`mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5 ${isPremium ? "bg-indigo-500/[0.08]" : "bg-white/[0.03]"}`}>
                    <Users className={`w-4 h-4 mt-0.5 shrink-0 ${isPremium ? "text-indigo-300" : "text-slate-500"}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{visitorLimit.toLocaleString()} visitors/month</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pagesLimit < 0 ? "Unlimited pages" : `Up to ${pagesLimit} pages`}
                      </p>
                      {/* No overage rate is published: we do not bill for it.
                          Going over the allowance triggers an upgrade
                          conversation, never a surprise charge. */}
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Zap className="w-3 h-3" />No overage charges
                      </p>
                    </div>
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPremium ? "text-indigo-400" : "text-emerald-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* ENM Pro badge — Pro and Biz both bundle it (see
                    enmTierForPlan(), the single source of truth for this),
                    Basic does not. */}
                {(plan.id === "pro" || plan.id === "biz") && (
                  <div className="mb-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5">
                    <Plug className="w-4 h-4 text-white shrink-0" />
                    <p className="text-xs font-bold text-white">Includes ExpertNear.Me Pro — see integrations →</p>
                  </div>
                )}

                <Link
                  href={`/onboarding?plan=${plan.id}&cycle=${cycle}`}
                  className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all ${
                    isPremium
                      ? "bg-white text-slate-950 hover:bg-slate-100"
                      : "bg-white/[0.06] text-white border border-white/[0.1] hover:bg-white/[0.1]"
                  }`}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* ── ExpertNear.Me Pro Integrations — full-width, own row below the
            plan cards. Previously the 4th item in the 3-column plan grid
            above, which squeezed it into a single narrow column instead of
            giving it the width this much content needs. ── */}
        <div className="relative mt-6 mx-auto max-w-3xl rounded-2xl border border-indigo-400/25 bg-gradient-to-b from-indigo-500/[0.08] to-violet-500/[0.04] p-8 text-white">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 bg-white text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow whitespace-nowrap">
              <Plug className="w-3 h-3" /> Included with Pro &amp; Biz
            </span>
          </div>

          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Plug className="w-5 h-5 text-indigo-300" />
              <h3 className="text-lg font-bold text-white">ExpertNear.Me Pro</h3>
            </div>
            <p className="text-slate-400 text-sm leading-snug max-w-xl mx-auto">
              Live API integrations powering your business operations — connected directly to your Passive Coder website.
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            {ENM_INTEGRATIONS.map(({ icon: Icon, label, desc, note }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 italic">{note}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-xs text-slate-400 text-center">
            Activated automatically when you subscribe to the <strong className="text-white">Pro</strong> or <strong className="text-white">Biz</strong> plan
          </div>
        </div>

        {/* Enterprise/custom needs beyond the standard tiers — static
            marketing copy, not tied to a purchasable plan row. */}
        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white">Need something custom?</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Multiple sites, white-label, dedicated infrastructure, custom integrations, or an SLA — let&apos;s build a plan around your needs.
            </p>
          </div>
          <Link
            href="/contact?dept=sales"
            className="shrink-0 flex items-center gap-2 border border-white/[0.15] text-white hover:bg-white/[0.06] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            Contact Sales <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          All plans include SSL, daily backups, page builder, and uptime monitoring. Prices in USD.
        </p>
      </div>
    </section>
  );
}
