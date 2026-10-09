"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Star, ArrowRight, ShieldCheck, Server, Wrench } from "lucide-react";
import { formatAmount, type CarePlan, type Currency, type DevPackage } from "@/lib/pricing/catalog";

/**
 * Public pricing (pricing model v2): one-time development, platform included
 * for year 1 then renewed yearly, Care monthly or yearly. USD by default;
 * Bangladeshi visitors are sent to the BDT landing page.
 */
export default function PricingSection({ packages, care }: { packages: DevPackage[]; care: CarePlan[] }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const fmt = (v: number) => formatAmount(v, currency);
  const careById = new Map(care.map((c) => [c.id, c]));
  const dev = (p: DevPackage) => (currency === "USD" ? p.dev_price_usd_cents : p.dev_price_bdt);
  const renew = (p: DevPackage) => (currency === "USD" ? p.renewal_yearly_usd_cents : p.renewal_yearly_bdt);
  const extra = (p: DevPackage) => (currency === "USD" ? p.extra_page_usd_cents : p.extra_page_bdt);
  const careMonthly = (c: CarePlan) => (currency === "USD" ? c.monthly_usd_cents : c.monthly_bdt);

  return (
    <section id="pricing" className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Pay once for your website</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            One-time build price. Hosting, SSL, backups and your domain are included for the first year.
            No monthly bill unless you want our team looking after your site.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-full p-1">
            {(["USD", "BDT"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${currency === c ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}
              >
                {c === "USD" ? "USD $" : "BDT ৳"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {packages.map((p) => {
            const popular = p.id === "pro";
            const freeCare = p.free_care_plan_id ? careById.get(p.free_care_plan_id) : null;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl p-8 border ${popular ? "border-orange-500/60 bg-gradient-to-b from-orange-500/[0.08] to-white/[0.02]" : "border-white/[0.08] bg-white/[0.02]"}`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    <Star className="w-3 h-3" /> Most popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">{fmt(dev(p))}</span>
                  <span className="text-slate-400 text-sm">one-time</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  then {fmt(renew(p))}/year from year 2, or covered by Care
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-300 flex-1">
                  <Li>We build {p.pages_built} pages for you</Li>
                  <Li>No page limit, add as many as you like</Li>
                  <Li>{p.storage_gb} GB storage</Li>
                  <Li>Hosting, SSL, daily backups, domain: 12 months included</Li>
                  {freeCare && (
                    <Li strong>
                      {p.free_care_months} {p.free_care_months === 1 ? "month" : "months"} of {freeCare.name} free
                    </Li>
                  )}
                  <Li>Extra pages built by us: {fmt(extra(p))} each</Li>
                  {p.id !== "basic" && <Li>CRM, online booking, invoicing and AI content tools</Li>}
                  {p.id === "biz" && <Li>E-commerce, restaurant POS and multi-domain</Li>}
                </ul>

                <Link
                  href={`/onboarding?package=${p.id}&currency=${currency}`}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-colors ${popular ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-white/[0.08] text-white hover:bg-white/[0.14]"}`}
                >
                  Get {p.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* How the yearly part works */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Fact icon={ShieldCheck} title="Pay once to build">Your website, designed and built by our team. Yours to keep using.</Fact>
          <Fact icon={Server} title="Platform, yearly">Hosting, SSL, backups and domain. Year 1 is included. No monthly platform fees.</Fact>
          <Fact icon={Wrench} title="Care, optional">Our team updates your site every month. Care includes the platform.</Fact>
        </div>

        {/* Care teaser */}
        {care.length > 0 && (
          <div className="mt-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Website Care Plans</h3>
                <p className="mt-2 text-slate-400 max-w-xl">
                  Changes, new pages, reports and priority support, done by our team. Hosting and domain included.
                  Monthly, or yearly with 4 months free.
                </p>
              </div>
              <Link href="/website-maintenance" className="inline-flex items-center gap-2 text-orange-400 font-semibold hover:text-orange-300">
                Compare Care plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {care.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-5">
                  <div className="font-semibold text-white">{c.name}</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {fmt(careMonthly(c))}<span className="text-sm font-normal text-slate-400">/month</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {c.changes_per_month == null ? "Unlimited changes (fair use)" : `${c.changes_per_month} changes a month`}
                    {c.pages_per_month > 0 ? ` · ${c.pages_per_month} new pages` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bangladesh prompt */}
        <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-white">বাংলাদেশ থেকে? Running a business in Bangladesh?</div>
            <p className="mt-1 text-slate-300 text-sm">
              We have special Bangladesh pricing in taka, with bKash, Nagad and bank payment.
            </p>
          </div>
          <Link href="/website-for-bangladeshi-businesses#pricing" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600">
            বাংলাদেশি প্রাইস দেখুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Li({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
      <span className={strong ? "font-semibold text-white" : undefined}>{children}</span>
    </li>
  );
}

function Fact({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 font-semibold text-white">
        <Icon className="w-4 h-4 text-orange-400" /> {title}
      </div>
      <p className="mt-2 text-slate-400">{children}</p>
    </div>
  );
}
