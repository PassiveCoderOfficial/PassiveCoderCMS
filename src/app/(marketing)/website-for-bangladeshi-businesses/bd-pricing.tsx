import Link from "next/link";
import { loadCatalog } from "@/lib/pricing/load";
import { formatAmount, toBanglaDigits } from "@/lib/pricing/catalog";

const tk = (v: number) => formatAmount(v, "BDT", { banglaDigits: true });
const bn = (n: number) => toBanglaDigits(String(n));

/** BDT pricing (model v2): one-time build, yearly platform, Care monthly/yearly. */
export default async function BdPricing() {
  const { packages, care } = await loadCatalog();
  const careById = new Map(care.map((c) => [c.id, c]));

  return (
    <section id="pricing" className="bg-gray-950 text-white">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20 text-center">
        <span className="inline-block rounded-full bg-orange-500/10 text-orange-400 text-xs sm:text-sm font-bold px-4 py-1.5 border border-orange-500/20 mb-5">
          একবার পেমেন্ট, মাসে মাসে কোনো চার্জ নেই
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold mb-3">ওয়েবসাইট বানাতে একবারই পেমেন্ট</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-10">
          প্রথম ১২ মাসের হোস্টিং, SSL, ব্যাকআপ আর ডোমেইন প্যাকেজের সাথেই। দ্বিতীয় বছর থেকে শুধু ছোট একটা ইয়ারলি প্ল্যাটফর্ম ফি, অথবা Care নিলে সেটাও লাগবে না।
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {packages.map((p) => {
            const popular = p.id === "pro";
            const freeCare = p.free_care_plan_id ? careById.get(p.free_care_plan_id) : null;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col ${popular ? "border-2 border-orange-500 bg-gradient-to-b from-orange-500/10 to-rose-500/5 shadow-2xl shadow-orange-900/30" : "border border-gray-800 bg-gray-900/60"}`}
              >
                {popular && (
                  <span className="absolute -top-3 left-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    সবচেয়ে জনপ্রিয়
                  </span>
                )}
                <span className="text-sm font-bold text-gray-400 mb-1">{p.name} প্যাকেজ</span>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">{tk(p.dev_price_bdt)}</span>
                  <span className="text-gray-400 text-sm mb-1">একবার</span>
                </div>
                <p className="text-orange-300 text-sm font-semibold mb-6">
                  দ্বিতীয় বছর থেকে {tk(p.renewal_yearly_bdt)}/বছর, অথবা Care-এর মধ্যেই
                </p>
                <ul className="space-y-2.5 mb-8 flex-1 text-sm text-gray-300">
                  <Li>আমরা {bn(p.pages_built)}টি পেজ বানিয়ে দিব</Li>
                  <Li>পেজের কোনো লিমিট নেই, নিজে যত খুশি যোগ করুন</Li>
                  <Li>{bn(p.storage_gb)} GB স্টোরেজ</Li>
                  <Li>১২ মাস হোস্টিং, SSL, ব্যাকআপ আর ডোমেইন ফ্রি</Li>
                  {freeCare && (
                    <Li strong>
                      {bn(p.free_care_months)} মাস {freeCare.name} ফ্রি
                    </Li>
                  )}
                  <Li>বাড়তি পেজ আমরা বানালে {tk(p.extra_page_bdt)}/পেজ</Li>
                  {p.id !== "basic" && <Li>CRM, অনলাইন বুকিং, ইনভয়েস আর AI কন্টেন্ট</Li>}
                  {p.id === "biz" && <Li>অনলাইন শপ, রেস্টুরেন্ট POS, একাধিক ডোমেইন</Li>}
                </ul>
                <Link
                  href={`/onboarding?package=${p.id}&currency=BDT`}
                  className={`inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors ${popular ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white" : "bg-white text-gray-900 hover:bg-gray-100"}`}
                >
                  {p.name} শুরু করুন
                </Link>
              </div>
            );
          })}
        </div>

        {care.length > 0 && (
          <div className="mt-12 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 sm:p-8 text-left">
            <h3 className="text-xl font-bold text-white">Care প্যাকেজ: আপনার সাইট দেখাশোনা আমাদের</h3>
            <p className="text-gray-400 text-sm mt-2">
              প্রতি মাসে চেঞ্জ, নতুন পেজ, রিপোর্ট আর সাপোর্ট। হোস্টিং আর ডোমেইন রিনিউ সহ। ইয়ারলি নিলে ৪ মাস ফ্রি।
            </p>
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {care.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-800 bg-black/30 p-5">
                  <div className="font-semibold text-white">{c.name}</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {tk(c.monthly_bdt)}<span className="text-sm font-normal text-gray-400">/মাস</span>
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">বছরে {tk(c.yearly_bdt)} (৪ মাস ফ্রি)</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {c.changes_per_month == null ? "আনলিমিটেড চেঞ্জ (ফেয়ার ইউজ)" : `মাসে ${bn(c.changes_per_month)}টি চেঞ্জ`}
                    {c.pages_per_month > 0 ? `, ${bn(c.pages_per_month)}টি নতুন পেজ` : ""}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/website-maintenance" className="inline-block mt-5 text-orange-400 font-semibold text-sm">
              Care প্যাকেজের বিস্তারিত দেখুন
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Li({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg viewBox="0 0 20 20" className="w-4 h-4 mt-0.5 shrink-0 fill-orange-400" aria-hidden>
        <path d="M7.6 13.4 4.2 10l-1.2 1.2 4.6 4.6 9.8-9.8-1.2-1.2z" />
      </svg>
      <span className={strong ? "font-semibold text-white" : undefined}>{children}</span>
    </li>
  );
}
