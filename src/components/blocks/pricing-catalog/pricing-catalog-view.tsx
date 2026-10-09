"use client";

import { useState } from "react";
import { ArrowRight, Check, Server, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { formatAmount, toBanglaDigits, type CareCycle, type CarePlan, type Currency, type DevPackage } from "@/lib/pricing/catalog";
import type { PricingCatalogBlockProps } from "@/types/cms";

type Data = PricingCatalogBlockProps["data"];

const T = {
  en: {
    oneTime: "one-time", then: (v: string) => `then ${v}/year from year 2, or covered by Care`,
    build: (n: string) => `We build ${n} pages for you`, noLimit: "No page limit, add as many as you like",
    storage: (n: string) => `${n} GB storage`, yearOne: "Hosting, SSL, daily backups and domain for 12 months",
    freeCare: (m: string, n: string) => `${m} ${Number(m) === 1 ? "month" : "months"} of ${n} free`,
    extra: (v: string) => `Extra pages built by us: ${v} each`, crm: "CRM, online booking, invoicing and AI content tools",
    biz: "Online shop, restaurant POS and multiple domains", get: (n: string) => `Get ${n}`, popular: "Most popular",
    perMonth: "/month", monthly: "Monthly", yearly: "Yearly · 4 months free", billedYearly: (v: string) => `${v} billed yearly`,
    billedMonthly: "billed monthly, cancel any time", start: (n: string) => `Start ${n}`,
    f1: ["Pay once to build", "Your website, designed and built by our team."],
    f2: ["Platform, yearly", "Hosting, SSL, backups and domain. Year 1 included. No monthly platform fee."],
    f3: ["Care, optional", "Our team updates your site every month. Care includes the platform."],
    careTitle: "Website Care Plans", careSub: "Changes, new pages, reports and priority support, done by our team. Hosting and domain included.",
    compare: "Compare Care plans", fair: "Unlimited changes (fair use)", changes: (n: string) => `${n} changes a month`, pages: (n: string) => `${n} new pages`,
    bdTitle: "বাংলাদেশ থেকে? Running a business in Bangladesh?", bdSub: "Special Bangladesh pricing in taka, with bKash, Nagad and bank payment.", bdCta: "বাংলাদেশি প্রাইস দেখুন",
  },
  bn: {
    oneTime: "একবার", then: (v: string) => `দ্বিতীয় বছর থেকে ${v}/বছর, অথবা Care-এর মধ্যেই`,
    build: (n: string) => `আমরা ${n}টি পেজ বানিয়ে দিব`, noLimit: "পেজের কোনো লিমিট নেই, নিজে যত খুশি যোগ করুন",
    storage: (n: string) => `${n} GB স্টোরেজ`, yearOne: "১২ মাস হোস্টিং, SSL, ব্যাকআপ আর ডোমেইন ফ্রি",
    freeCare: (m: string, n: string) => `${m} মাস ${n} ফ্রি`,
    extra: (v: string) => `বাড়তি পেজ আমরা বানালে ${v}/পেজ`, crm: "CRM, অনলাইন বুকিং, ইনভয়েস আর AI কন্টেন্ট",
    biz: "অনলাইন শপ, রেস্টুরেন্ট POS, একাধিক ডোমেইন", get: (n: string) => `${n} শুরু করুন`, popular: "সবচেয়ে জনপ্রিয়",
    perMonth: "/মাস", monthly: "মাসিক", yearly: "বাৎসরিক · ৪ মাস ফ্রি", billedYearly: (v: string) => `বছরে ${v}`,
    billedMonthly: "মাসে মাসে, যেকোনো সময় বন্ধ করা যাবে", start: (n: string) => `${n} শুরু করুন`,
    f1: ["একবার পেমেন্টে ওয়েবসাইট", "আমাদের টিম ডিজাইন করে বানিয়ে দেয়।"],
    f2: ["প্ল্যাটফর্ম, বছরে একবার", "হোস্টিং, SSL, ব্যাকআপ, ডোমেইন। প্রথম বছর ফ্রি। মাসিক কোনো ফি নেই।"],
    f3: ["Care, ঐচ্ছিক", "প্রতি মাসে আমাদের টিম সাইট আপডেট করে। Care-এ প্ল্যাটফর্মও থাকে।"],
    careTitle: "Care প্যাকেজ: আপনার সাইট দেখাশোনা আমাদের", careSub: "প্রতি মাসে চেঞ্জ, নতুন পেজ, রিপোর্ট আর সাপোর্ট। হোস্টিং আর ডোমেইন রিনিউ সহ।",
    compare: "Care প্যাকেজ দেখুন", fair: "আনলিমিটেড চেঞ্জ (ফেয়ার ইউজ)", changes: (n: string) => `মাসে ${n}টি চেঞ্জ`, pages: (n: string) => `${n}টি নতুন পেজ`,
    bdTitle: "", bdSub: "", bdCta: "",
  },
};

export function PricingCatalogView({ data, packages, care }: { data: Data; packages: DevPackage[]; care: CarePlan[] }) {
  const [currency, setCurrency] = useState<Currency>(data.defaultCurrency ?? "USD");
  const [cycle, setCycle] = useState<CareCycle>("yearly");
  const lang = data.language === "bn" ? "bn" : "en";
  const t = T[lang];
  const dark = data.tone !== "light";
  const num = (n: number) => (lang === "bn" ? toBanglaDigits(String(n)) : String(n));
  const money = (v: number) => formatAmount(v, currency, { banglaDigits: lang === "bn" && currency === "BDT" });
  const careById = new Map(care.map((c) => [c.id, c]));
  const cta = data.ctaBaseUrl || "/onboarding";

  const c = dark
    ? { text: "text-white", muted: "text-slate-400", body: "text-slate-300", card: "border-white/10 bg-white/[0.03]", hi: "border-orange-500/60 bg-gradient-to-b from-orange-500/[0.12] to-white/[0.02] shadow-[0_30px_80px_-30px_rgba(255,118,0,0.45)]", pill: "bg-white/[0.06] border-white/10", on: "bg-white text-slate-950", off: "text-slate-400 hover:text-white", btn: "bg-white/[0.08] text-white hover:bg-white/[0.14]", sub: "border-white/[0.06] bg-black/20" }
    : { text: "text-slate-900", muted: "text-slate-500", body: "text-slate-700", card: "border-slate-200 bg-white", hi: "border-orange-500 bg-gradient-to-b from-orange-50 to-white shadow-[0_30px_80px_-30px_rgba(255,118,0,0.35)]", pill: "bg-slate-100 border-slate-200", on: "bg-slate-900 text-white", off: "text-slate-500 hover:text-slate-900", btn: "bg-slate-900 text-white hover:bg-slate-800", sub: "border-slate-200 bg-slate-50" };

  const showPackages = data.mode !== "care";
  const showCareFull = data.mode === "care";
  const showCareTeaser = data.mode === "both";

  return (
    <div className="max-w-6xl mx-auto">
      {(data.eyebrow || data.title || data.subtitle) && (
        <div className="text-center mb-10">
          {data.eyebrow && <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-bold uppercase tracking-[0.18em] mb-3"><Sparkles className="w-3.5 h-3.5" />{data.eyebrow}</div>}
          {data.title && <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${c.text}`}>{data.title}</h2>}
          {data.subtitle && <p className={`mt-4 text-lg max-w-2xl mx-auto ${c.muted}`}>{data.subtitle}</p>}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {showCareFull && <Toggle cls={c} value={cycle} set={setCycle} opts={[["monthly", t.monthly], ["yearly", t.yearly]]} />}
        {data.showCurrencyToggle && <Toggle cls={c} value={currency} set={setCurrency} opts={[["USD", "USD $"], ["BDT", "BDT ৳"]]} />}
      </div>

      {showPackages && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {packages.map((p) => {
              const popular = p.id === "pro";
              const free = p.free_care_plan_id ? careById.get(p.free_care_plan_id) : null;
              const dev = currency === "USD" ? p.dev_price_usd_cents : p.dev_price_bdt;
              const ren = currency === "USD" ? p.renewal_yearly_usd_cents : p.renewal_yearly_bdt;
              const ext = currency === "USD" ? p.extra_page_usd_cents : p.extra_page_bdt;
              return (
                <div key={p.id} className={`relative flex flex-col rounded-3xl border p-8 transition-transform hover:-translate-y-1 ${popular ? c.hi : c.card}`}>
                  {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-1 text-xs font-bold text-white">{t.popular}</div>}
                  <h3 className={`text-xl font-bold ${c.text}`}>{p.name}</h3>
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className={`text-5xl font-extrabold tracking-tight ${c.text}`}>{money(dev)}</span>
                    <span className={`text-sm ${c.muted}`}>{t.oneTime}</span>
                  </div>
                  <p className={`mt-2 text-sm ${c.muted}`}>{t.then(money(ren))}</p>
                  <ul className={`mt-7 space-y-3 text-sm flex-1 ${c.body}`}>
                    <Li>{t.build(num(p.pages_built))}</Li>
                    <Li>{t.noLimit}</Li>
                    <Li>{t.storage(num(p.storage_gb))}</Li>
                    <Li>{t.yearOne}</Li>
                    {free && <Li strong={c.text}>{t.freeCare(num(p.free_care_months), free.name)}</Li>}
                    <Li>{t.extra(money(ext))}</Li>
                    {p.id !== "basic" && <Li>{t.crm}</Li>}
                    {p.id === "biz" && <Li>{t.biz}</Li>}
                  </ul>
                  <a href={`${cta}?package=${p.id}&currency=${currency}`} className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition-colors ${popular ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90" : c.btn}`}>
                    {t.get(p.name)} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {([[ShieldCheck, t.f1], [Server, t.f2], [Wrench, t.f3]] as [React.ElementType, string[]][]).map(([I, [h, b]]) => (
              <div key={h} className={`rounded-2xl border p-5 ${c.card}`}>
                <div className={`flex items-center gap-2 font-semibold ${c.text}`}><I className="w-4 h-4 text-orange-500" /> {h}</div>
                <p className={`mt-2 ${c.muted}`}>{b}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {showCareFull && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {care.map((cp) => {
            const popular = cp.id === "care_pro";
            const price = currency === "USD" ? (cycle === "monthly" ? cp.monthly_usd_cents : cp.yearly_usd_cents) : cycle === "monthly" ? cp.monthly_bdt : cp.yearly_bdt;
            const perMonth = cycle === "yearly" ? Math.round(price / 12) : price;
            return (
              <div key={cp.id} className={`relative flex flex-col rounded-3xl border p-8 ${popular ? c.hi : c.card}`}>
                {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-1 text-xs font-bold text-white">{t.popular}</div>}
                <h3 className={`text-xl font-bold ${c.text}`}>{cp.name}</h3>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className={`text-5xl font-extrabold tracking-tight ${c.text}`}>{money(perMonth)}</span>
                  <span className={`text-sm ${c.muted}`}>{t.perMonth}</span>
                </div>
                <p className={`mt-2 text-sm h-5 ${c.muted}`}>{cycle === "yearly" ? t.billedYearly(money(price)) : t.billedMonthly}</p>
                <ul className={`mt-7 space-y-3 text-sm flex-1 ${c.body}`}>
                  {cp.features.map((f) => <Li key={f}>{f}</Li>)}
                </ul>
                <a href={`${cta}?care=${cp.id}&cycle=${cycle}&currency=${currency}`} className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold ${popular ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white" : c.btn}`}>
                  {t.start(cp.name)} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      )}

      {showCareTeaser && care.length > 0 && (
        <div className={`mt-12 rounded-3xl border p-8 ${c.card}`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className={`text-2xl font-bold ${c.text}`}>{t.careTitle}</h3>
              <p className={`mt-2 max-w-xl ${c.muted}`}>{t.careSub}</p>
            </div>
            {data.careLinkUrl && <a href={data.careLinkUrl} className="inline-flex items-center gap-2 font-semibold text-orange-500 hover:text-orange-400">{t.compare} <ArrowRight className="w-4 h-4" /></a>}
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {care.map((cp) => (
              <div key={cp.id} className={`rounded-2xl border p-5 ${c.sub}`}>
                <div className={`font-semibold ${c.text}`}>{cp.name}</div>
                <div className={`mt-1 text-2xl font-bold ${c.text}`}>{money(currency === "USD" ? cp.monthly_usd_cents : cp.monthly_bdt)}<span className={`text-sm font-normal ${c.muted}`}>{t.perMonth}</span></div>
                <div className={`mt-1 text-xs ${c.muted}`}>
                  {cp.changes_per_month == null ? t.fair : t.changes(num(cp.changes_per_month))}
                  {cp.pages_per_month > 0 ? ` · ${t.pages(num(cp.pages_per_month))}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.showBdPrompt && lang === "en" && data.bdPromptUrl && (
        <div className="mt-10 rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.07] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className={`text-lg font-bold ${c.text}`}>{t.bdTitle}</div>
            <p className={`mt-1 text-sm ${c.muted}`}>{t.bdSub}</p>
          </div>
          <a href={data.bdPromptUrl} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600">{t.bdCta} <ArrowRight className="w-4 h-4" /></a>
        </div>
      )}
    </div>
  );
}

function Li({ children, strong }: { children: React.ReactNode; strong?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
        <Check className="w-3 h-3 text-emerald-500" strokeWidth={3} />
      </span>
      <span className={strong ? `font-semibold ${strong}` : undefined}>{children}</span>
    </li>
  );
}

function Toggle<V extends string>({ cls, value, set, opts }: { cls: { pill: string; on: string; off: string }; value: V; set: (v: V) => void; opts: [V, string][] }) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border p-1 ${cls.pill}`}>
      {opts.map(([v, l]) => (
        <button key={v} type="button" onClick={() => set(v)} className={`px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all ${value === v ? cls.on : cls.off}`}>{l}</button>
      ))}
    </div>
  );
}
