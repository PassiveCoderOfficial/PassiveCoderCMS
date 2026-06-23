"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Star, ArrowRight, Users, Zap, Plug } from "lucide-react";

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

const PRO_INTEGRATIONS = [
  { label: "CRM", desc: "Customer & lead management" },
  { label: "Booking", desc: "Appointments & scheduling" },
  { label: "Accounting", desc: "Expenses, P&L, reports" },
  { label: "Invoicing", desc: "Send & track invoices" },
  { label: "Payments", desc: "Online payment collection" },
  { label: "Email Marketing", desc: "Campaigns & automations" },
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

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Simple, honest pricing</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            Everything your business needs online. No surprises.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full border border-green-200">
            <CheckCircle className="w-4 h-4" /> No payment required at signup — pay after your account is created
          </div>
        </div>

        {/* Billing cycle toggle */}
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

        {!plans.length && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {["Basic", "Pro", "Custom"].map(name => (
              <div key={name} className="rounded-2xl border border-gray-200 bg-white p-8 animate-pulse">
                <div className="h-5 w-24 bg-gray-100 rounded mb-4" />
                <div className="h-10 w-20 bg-gray-100 rounded mb-6" />
                {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded mb-3 w-full" />)}
                <div className="h-10 bg-gray-100 rounded mt-8" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isPremium = plan.id === "premium";
            const isCustom = plan.id === "custom";
            const price = priceFor(plan);
            const offersCycle = price > 0;
            const features: string[] = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as unknown as string ?? "[]");
            const monthlyPrice = (plan.price_monthly ?? 0) / 100;
            const yearlyPrice = (plan.price_yearly ?? 0) / 100;
            const yearlySavings = monthlyPrice > 0 && yearlyPrice > 0
              ? Math.round(monthlyPrice * 12 - yearlyPrice)
              : 0;
            const visitorLimit = plan.visitor_limit_monthly ?? 0;
            const overagePerK = (plan.overage_cents_per_1k ?? 0) / 100;

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

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {isCustom ? (
                    <div className="mt-3">
                      <span className="text-3xl font-extrabold text-gray-900">Custom</span>
                      <p className="text-sm text-gray-500 mt-1">Tailored pricing for your needs</p>
                    </div>
                  ) : offersCycle ? (
                    <>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                        <span className="text-gray-500 text-sm">{suffix}</span>
                      </div>
                      {cycle === "yearly" && yearlySavings > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          Save ${yearlySavings}/yr vs monthly billing
                        </p>
                      )}
                      {cycle === "monthly" && yearlyPrice > 0 && yearlySavings > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Or ${yearlyPrice}/yr — save ${yearlySavings}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mt-3">
                      <span className="text-xl font-bold text-gray-400">Not available {cycle}</span>
                    </div>
                  )}
                </div>

                {/* Visitor allowance callout */}
                {!isCustom && visitorLimit > 0 && (
                  <div className={`mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5 ${isPremium ? "bg-orange-100/60" : "bg-gray-50"}`}>
                    <Users className={`w-4 h-4 mt-0.5 shrink-0 ${isPremium ? "text-orange-600" : "text-gray-500"}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {visitorLimit.toLocaleString()} visitors/month
                      </p>
                      {overagePerK > 0 && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Zap className="w-3 h-3" />
                          ${overagePerK}/1,000 extra visitors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <ul className="space-y-3 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPremium ? "text-orange-500" : "text-green-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* ExpertNear.Me integrations — Pro only */}
                {isPremium && (
                  <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Plug className="w-4 h-4 text-orange-600 shrink-0" />
                      <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">
                        ExpertNear.Me Pro — Live API Integrations
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {PRO_INTEGRATIONS.map(({ label, desc }) => (
                        <div key={label} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{label}</p>
                            <p className="text-[10px] text-gray-500 leading-tight">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={isCustom ? "/contact?dept=sales" : `/onboarding?plan=${plan.id}&cycle=${cycle}`}
                  className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all ${
                    isPremium
                      ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200"
                      : isCustom
                      ? "border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {isCustom ? "Contact Sales" : "Get Started"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          All plans include SSL, daily backups, page builder, and uptime monitoring. Prices in USD.
        </p>
      </div>
    </section>
  );
}
