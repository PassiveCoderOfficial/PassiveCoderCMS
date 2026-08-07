import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";

const bangla = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bangla",
});

export const metadata: Metadata = {
  title: "প্রবাসী ব্যবসায়ীদের জন্য প্রফেশনাল ওয়েবসাইট | Passive Coder",
  description:
    "কনস্ট্রাকশন, HVAC, MEP, হ্যান্ডিম্যান, রেনোভেশন ব্যবসার জন্য প্রফেশনাল ওয়েবসাইট — বছরে পেমেন্ট করে ৬ মাসের মূল্য বাঁচান। UAE, Saudi Arabia, Oman, Qatar, Malaysia, Singapore প্রবাসীদের জন্য।",
  robots: { index: true, follow: true },
};

const WA_NUMBER = "8801678669699";
const WA_TEXT = encodeURIComponent(
  "আসসালামু আলাইকুম, আমি ফেসবুক বিজ্ঞাপনে দেখেছি — ওয়েবসাইট প্যাকেজ সম্পর্কে জানতে চাই।"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

const trades = [
  { emoji: "🏗️", label: "কন্সট্রাকশন" },
  { emoji: "🔧", label: "মেইনটেন্যান্স" },
  { emoji: "❄️", label: "HVAC / MEP" },
  { emoji: "🛠️", label: "হ্যান্ডিম্যান" },
  { emoji: "🏠", label: "রেনোভেশন" },
  { emoji: "🧱", label: "রুফিং" },
  { emoji: "🪵", label: "ফ্লোরিং" },
  { emoji: "🎨", label: "ইন্টেরিয়র / ডেকোরেশন" },
];

const features = [
  "প্রফেশনাল ডিজাইন — ফুল সাইট বিল্ড, আপনাকে কিছু করতে হবে না",
  "CRM — লিড ও কাস্টমার ম্যানেজমেন্ট",
  "অ্যাপয়েন্টমেন্ট / বুকিং সিস্টেম",
  "ইনভয়েসিং ও একাউন্টিং টুলস",
  "প্রাইসিং টেবিল ও প্যাকেজ শোকেস",
  "সার্ভিস শোকেস, পোর্টফোলিও গ্যালারি, টেস্টিমোনিয়াল",
  "SSL, ডেইলি ব্যাকআপ, আপটাইম মনিটরিং",
  "ফ্রি ডোমেইন (.com/.org/.net) — ১ বছর",
];

const countries = [
  "🇦🇪 UAE",
  "🇸🇦 Saudi Arabia",
  "🇴🇲 Oman",
  "🇶🇦 Qatar",
  "🇲🇾 Malaysia",
  "🇸🇬 Singapore",
];

const faqs = [
  {
    q: "আমাকে কি বাংলাদেশে থাকতে হবে?",
    a: "না। আপনি যেখানেই থাকুন — UAE, Saudi, Malaysia, Singapore — আমরা রিমোটলি পুরো সেটআপ করে দিই। শুধু WhatsApp-এ যোগাযোগ রাখলেই চলবে।",
  },
  {
    q: "ইয়ারলি প্যাকেজে আসলে কত সাশ্রয় হয়?",
    a: "Pro প্ল্যান মাসিক $80, অর্থাৎ ১২ মাসে $960। ইয়ারলি নিলে দিতে হবে মাত্র $480 — সরাসরি ৬ মাসের পেমেন্ট বেঁচে যায়।",
  },
  {
    q: "সাইট তৈরি হতে কতদিন লাগে?",
    a: "সাধারণত সাইন-আপের পর কয়েক দিনের মধ্যেই আপনার সাইট লাইভ হয়ে যায়। ডিজাইন, কন্টেন্ট, ডোমেইন — সব আমরা হ্যান্ডেল করি।",
  },
  {
    q: "পেমেন্ট কীভাবে করব?",
    a: "WhatsApp-এ যোগাযোগ করলে আমরা আপনাকে সবচেয়ে সহজ পেমেন্ট মেথড বলে দেব — প্রবাসী হিসেবে যেটা আপনার জন্য সুবিধাজনক।",
  },
];

export default function BangladeshiExpatLandingPage() {
  return (
    <div className={`${bangla.variable} font-[family-name:var(--font-bangla)] bg-white text-slate-900`}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="absolute inset-0 -z-10 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[length:24px_24px]" />
        <div className="mx-auto max-w-5xl px-5 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold px-4 py-1.5 mb-6">
            🇧🇩 প্রবাসী কন্ট্রাক্টর ও সার্ভিস ব্যবসার জন্য
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-slate-900">
            ৬ মাসের টাকায় <span className="text-emerald-600">১২ মাস</span> —
            <br className="hidden sm:block" /> প্রফেশনাল ওয়েবসাইট
          </h1>
          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto">
            UAE, Saudi Arabia, Oman, Qatar, Malaysia, Singapore-এ থাকা বাংলাদেশি
            কন্ট্রাক্টর ও সার্ভিস ব্যবসায়ীদের জন্য — ওয়েবসাইট + CRM + বুকিং, সব এক
            জায়গায়। এজেন্সির মতো দাম না দিয়ে।
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full shadow-lg shadow-emerald-200 hover:shadow-xl transition-all duration-200"
            >
              <WaIcon />
              WhatsApp-এ কথা বলুন
            </a>
            <span className="text-xs sm:text-sm text-slate-500">
              ফ্রি কনসালটেশন — কোনো বাধ্যবাধকতা নেই
            </span>
          </div>
        </div>
      </section>

      {/* ── Who this is for ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          আপনার ব্যবসা কি এর মধ্যে পড়ে?
        </h2>
        <p className="text-center text-slate-500 mb-10">
          কন্ট্রাক্টিং ও সার্ভিস বিজনেসের জন্য বিশেষভাবে তৈরি
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {trades.map((t) => (
            <div
              key={t.label}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors px-4 py-6 text-center"
            >
              <span className="text-3xl">{t.emoji}</span>
              <span className="text-sm font-semibold text-slate-700">{t.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {countries.map((c) => (
            <span
              key={c}
              className="rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── Offer block ──────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20 text-center">
          <span className="inline-block rounded-full bg-emerald-500/15 text-emerald-400 text-xs sm:text-sm font-semibold px-4 py-1.5 mb-5">
            Pro প্যাকেজ — ইয়ারলি অফার
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold mb-6">
            পুরো বছরের ওয়েবসাইট + CRM + বুকিং সিস্টেম
          </h2>
          <div className="flex items-end justify-center gap-4 mb-2">
            <span className="text-slate-400 line-through text-xl sm:text-2xl">$960</span>
            <span className="text-4xl sm:text-6xl font-extrabold text-emerald-400">$480</span>
            <span className="text-slate-400 text-sm sm:text-base mb-1 sm:mb-2">/বছর</span>
          </div>
          <p className="text-emerald-400 font-semibold mb-8">
            ৬ মাসের পেমেন্ট বেঁচে যাচ্ছে — মাসিক হিসেবে নিলে যেখানে $960 লাগত
          </p>

          <div className="grid sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto mb-10">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <CheckIcon />
                <span className="text-sm sm:text-base text-slate-200">{f}</span>
              </div>
            ))}
          </div>

          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-200"
          >
            <WaIcon />
            অফারটি নিতে WhatsApp করুন
          </a>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          সাধারণ জিজ্ঞাসা
        </h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h3 className="font-bold text-base sm:text-lg mb-2">{f.q}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-emerald-50 border-t border-emerald-100">
        <div className="mx-auto max-w-2xl px-5 py-14 sm:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            আজই আপনার ব্যবসার জন্য প্রফেশনাল ওয়েবসাইট শুরু করুন
          </h2>
          <p className="text-slate-600 mb-7 text-sm sm:text-base">
            মেসেজ দিন, আমরা ৫ মিনিটের মধ্যে রিপ্লাই দেব ইনশাআল্লাহ।
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-200"
          >
            <WaIcon />
            এখনই WhatsApp করুন
          </a>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 py-6">
        Passive Coder — passivecoder.com
      </footer>

      {/* ── Sticky mobile WhatsApp bar ───────────────────────────────── */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#25D366] text-white font-bold text-center py-3.5 flex items-center justify-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
      >
        <WaIcon />
        WhatsApp-এ কথা বলুন
      </a>
      <div className="sm:hidden h-14" />
    </div>
  );
}

function WaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 shrink-0 fill-white">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-5 h-5 shrink-0 fill-emerald-400 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}
