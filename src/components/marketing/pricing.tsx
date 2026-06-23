"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Star, ArrowRight, Users, Zap, Plug, BookOpen, Users2, Receipt, Calculator, CreditCard, Mail, ShoppingCart } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_yearly: number;
  price_monthly: number;
  storage_gb: number;
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

  const priceFor = (plan: Plan): number => {
    const cents = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
    return (cents ?? 0) / 100;
  };

  const suffix = cycle === "monthly" ? "/month" : "/year";

  const visiblePlans = plans.filter(p => p.id !== "custom");
  const customPlan   = plans.find(p => p.id === "custom");

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Simple, honest pricing</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            Everything your business needs online. No surprises.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full border border-green-200">
            <CheckCircle className="w-4 h-4" /> No payment required at signup — pay after your account is created
          </div>
        </div>

        {/* Billing toggle */}
        {availableCycles.length > 1 && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  cycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  cycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Yearly
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Save</span>
              </button>
            </div>
          </div>
        )}

        {/* Skeleton */}
        {!plans.length && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {["Basic", "Pro", "Integrations"].map(name => (
              <div key={name} className="rounded-2xl border border-gray-200 bg-white p-8 animate-pulse">
                <div className="h-5 w-24 bg-gray-100 rounded mb-4" />
                <div className="h-10 w-20 bg-gray-100 rounded mb-6" />
                {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded mb-3 w-full" />)}
                <div className="h-10 bg-gray-100 rounded mt-8" />
              </div>
            ))}
          </div>
        )}

        {/* 3-column grid: Basic | Pro | ENM Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* ── Basic + Pro plan cards ── */}
          {visiblePlans.map((plan) => {
            const isPremium = plan.id === "premium";
            const price = priceFor(plan);
            const offersCycle = price > 0;
            const features: string[] = Array.isArray(plan.features)
              ? plan.features
              : JSON.parse(plan.features as unknown as string ?? "[]");
            const monthlyPrice  = (plan.price_monthly ?? 0) / 100;
            const yearlyPrice   = (plan.price_yearly  ?? 0) / 100;
            const yearlySavings = monthlyPrice > 0 && yearlyPrice > 0
              ? Math.round(monthlyPrice * 12 - yearlyPrice) : 0;
            const visitorLimit = plan.visitor_limit_monthly ?? 0;
            const overagePerK  = (plan.overage_cents_per_1k ?? 0) / 100;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  isPremium
                    ? "border-orange-500 shadow-xl shadow-orange-100 bg-gradient-to-b from-orange-50 to-white"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all"
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-current" /> Most Popular
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {offersCycle ? (
                    <>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                        <span className="text-gray-500 text-sm">{suffix}</span>
                      </div>
                      {cycle === "yearly" && yearlySavings > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-1">Save ${yearlySavings}/yr vs monthly</p>
                      )}
                      {cycle === "monthly" && yearlyPrice > 0 && yearlySavings > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Or ${yearlyPrice}/yr — save ${yearlySavings}</p>
                      )}
                    </>
                  ) : (
                    <div className="mt-3">
                      <span className="text-xl font-bold text-gray-400">Not available {cycle}</span>
                    </div>
                  )}
                </div>

                {/* Visitor allowance */}
                {visitorLimit > 0 && (
                  <div className={`mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5 ${isPremium ? "bg-orange-100/60" : "bg-gray-50"}`}>
                    <Users className={`w-4 h-4 mt-0.5 shrink-0 ${isPremium ? "text-orange-600" : "text-gray-500"}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{visitorLimit.toLocaleString()} visitors/month</p>
                      {overagePerK > 0 && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Zap className="w-3 h-3" />${overagePerK}/1,000 extra visitors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPremium ? "text-orange-500" : "text-green-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* ENM Pro badge on Pro card */}
                {isPremium && (
                  <div className="mb-6 flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5">
                    <Plug className="w-4 h-4 text-white shrink-0" />
                    <p className="text-xs font-bold text-white">Includes ExpertNear.Me Pro — see integrations →</p>
                  </div>
                )}

                <Link
                  href={`/onboarding?plan=${plan.id}&cycle=${cycle}`}
                  className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all ${
                    isPremium
                      ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}

          {/* ── Column 3: ExpertNear.Me Pro Integrations ── */}
          <div className="relative rounded-2xl border-2 border-orange-400 bg-gradient-to-b from-orange-600 to-orange-700 p-8 flex flex-col text-white shadow-xl shadow-orange-200">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 bg-white text-orange-600 text-xs font-bold px-3 py-1 rounded-full shadow">
                <Plug className="w-3 h-3" /> Included with Pro
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Plug className="w-5 h-5 text-orange-200" />
                <h3 className="text-lg font-bold text-white">ExpertNear.Me Pro</h3>
              </div>
              <p className="text-orange-200 text-sm leading-snug">
                Live API integrations powering your business operations — connected directly to your Passive Coder website.
              </p>
            </div>

            <ul className="space-y-4 flex-1 mb-8">
              {ENM_INTEGRATIONS.map(({ icon: Icon, label, desc, note }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-orange-200">{desc}</p>
                    <p className="text-[10px] text-orange-300 mt-0.5 italic">{note}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3 text-xs text-orange-100 text-center">
              Activated automatically when you subscribe to the <strong className="text-white">Pro</strong> plan
            </div>
          </div>
        </div>

        {/* Custom plan — slim strip */}
        {customPlan && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900">Need something custom?</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Multiple sites, white-label, dedicated infrastructure, custom integrations, or an SLA — let&apos;s build a plan around your needs.
              </p>
            </div>
            <Link
              href="/contact?dept=sales"
              className="shrink-0 flex items-center gap-2 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
            >
              Contact Sales <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          All plans include SSL, daily backups, page builder, and uptime monitoring. Prices in USD.
        </p>
      </div>
    </section>
  );
}
