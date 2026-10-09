"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import { carePrice, formatAmount, type CareCycle, type CarePlan, type Currency } from "@/lib/pricing/catalog";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What counts as one change?",
    a: "One edit request on one page that takes up to 30 minutes: text, an image, reordering a section, a colour, a form field. Bigger requests count as several changes, or we quote them as a new page. Unused changes do not roll over.",
  },
  {
    q: "What does fair use mean on Care Business?",
    a: "Up to about 20 hours of our team's time a month. If you need more than that in a month, we talk to you first. We never bill extra without asking.",
  },
  {
    q: "What is not included in any plan?",
    a: "A full redesign, new custom features or integrations, paid stock photos or videos, and ad spend. We are happy to quote these separately.",
  },
  {
    q: "Is hosting included?",
    a: "Yes. Every Care plan includes the platform: hosting, SSL, daily backups and your domain renewal. While Care is active you never pay a separate platform fee.",
  },
  {
    q: "What happens if I stop Care?",
    a: "Your website stays online. It moves to the yearly platform renewal for your package, so you keep your site and data. You can start Care again any time.",
  },
  {
    q: "My website was not built by Passive Coder. Can I still get Care?",
    a: "Yes. We move your site onto our platform first. Care for a moved site is yearly, or monthly with a one-time onboarding fee. Message us and we will look at your site.",
  },
  {
    q: "Do you manage Google Business Profile?",
    a: "No. Search Console, schema and SEO checks are included from Care Pro, but we do not manage Google Business Profile listings.",
  },
];

export default function CarePlans({ care }: { care: CarePlan[] }) {
  const [cycle, setCycle] = useState<CareCycle>("yearly");
  const [currency, setCurrency] = useState<Currency>("USD");

  return (
    <main>
      <section className="pt-20 pb-10 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white max-w-3xl mx-auto leading-tight">
          Website maintenance, done for you
        </h1>
        <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
          Our team keeps your website updated, fast and secure every month. Hosting, SSL, backups and domain
          renewal are included in every plan.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Toggle
            value={cycle}
            onChange={setCycle}
            options={[["monthly", "Monthly"], ["yearly", "Yearly · 4 months free"]]}
          />
          <Toggle value={currency} onChange={setCurrency} options={[["USD", "USD $"], ["BDT", "BDT ৳"]]} />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">
        {care.map((c) => {
          const popular = c.id === "care_pro";
          const price = carePrice(c, cycle, currency);
          const perMonth = cycle === "yearly" ? Math.round(price / 12) : price;
          return (
            <div
              key={c.id}
              className={`relative flex flex-col rounded-2xl p-8 border ${popular ? "border-orange-500/60 bg-gradient-to-b from-orange-500/[0.08] to-white/[0.02]" : "border-white/[0.08] bg-white/[0.02]"}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  <Star className="w-3 h-3" /> Most popular
                </div>
              )}
              <h2 className="text-xl font-bold text-white">{c.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">{formatAmount(perMonth, currency)}</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-400 h-5">
                {cycle === "yearly" ? `${formatAmount(price, currency)} billed yearly` : "billed monthly, cancel any time"}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300 flex-1">
                {c.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/onboarding?care=${c.id}&cycle=${cycle}&currency=${currency}`}
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold ${popular ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-white/[0.08] text-white hover:bg-white/[0.14]"}`}
              >
                Start {c.name} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-white">Need a new website too?</div>
            <p className="text-sm text-slate-400 mt-1">
              Every website package comes with free Care months. Get the website and a year of Care together and save 10%.
            </p>
          </div>
          <Link href="/#pricing" className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-5 py-3 font-semibold">
            See website packages <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-2xl font-bold text-white mb-6">Questions</h2>
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-semibold text-white flex justify-between gap-4">
                {f.q}
                <span className="text-slate-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function Toggle<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-full p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${value === v ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
