import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Hind_Siliguri } from "next/font/google";

const bangla = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bangla",
});

const LOGO =
  process.env.NEXT_PUBLIC_LOGO_URL ??
  "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png";

export const metadata: Metadata = {
  title: "প্রবাসী ব্যবসায়ীদের জন্য প্রফেশনাল ওয়েবসাইট | Passive Coder",
  description:
    "কনস্ট্রাকশন, HVAC, MEP, হ্যান্ডিম্যান, রেনোভেশন ব্যবসার জন্য প্রফেশনাল ওয়েবসাইট — বছরে পেমেন্ট করে ৬ মাসের মূল্য বাঁচান। UAE, সৌদি আরব, ওমান, কাতার, মালয়েশিয়া, সিঙ্গাপুর প্রবাসীদের জন্য।",
  robots: { index: true, follow: true },
};

const WA_NUMBER = "8801678669699";
const WA_TEXT = encodeURIComponent(
  "আসসালামু আলাইকুম, আমি ফেসবুক বিজ্ঞাপনে দেখেছি — ওয়েবসাইট প্যাকেজ সম্পর্কে জানতে চাই।"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;
const WA_DISPLAY = "+৮৮০ ১৬৭৮-৬৬৯৬৯৯";

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

// flagcdn.com serves real flag SVGs by ISO country code — no local assets to host.
const countries = [
  { code: "ae", name: "সংযুক্ত আরব আমিরাত" },
  { code: "sa", name: "সৌদি আরব" },
  { code: "om", name: "ওমান" },
  { code: "qa", name: "কাতার" },
  { code: "my", name: "মালয়েশিয়া" },
  { code: "sg", name: "সিঙ্গাপুর" },
];

const basicFeatures = [
  "প্রফেশনাল ডিজাইন — ফুল সাইট বিল্ড",
  "সার্ভিস শোকেস, পোর্টফোলিও গ্যালারি, টেস্টিমোনিয়াল",
  "ফ্রি ডোমেইন (.com/.org/.net) — ১ বছর",
  "SSL, ডেইলি ব্যাকআপ, আপটাইম মনিটরিং",
  "১০ GB স্টোরেজ",
  "ইমেইল সাপোর্ট",
];

const proFeatures = [
  "Basic-এর সব ফিচার",
  "CRM — লিড ও কাস্টমার ম্যানেজমেন্ট",
  "অ্যাপয়েন্টমেন্ট / বুকিং সিস্টেম",
  "ইনভয়েসিং ও একাউন্টিং টুলস",
  "প্রাইসিং টেবিল ও প্যাকেজ শোকেস",
  "ই-কমার্স ফিচার",
  "VIP প্রায়োরিটি সাপোর্ট",
];

const trustPoints = [
  { icon: "📜", title: "বৈধ ট্রেড লাইসেন্স", desc: "সরকার-নিবন্ধিত ব্যবসা, লুকানোর কিছু নেই" },
  { icon: "🏢", title: "ফিজিক্যাল অফিস", desc: "কাগজে-কলমে নয়, সত্যিকারের অফিস আছে" },
  { icon: "🏦", title: "বিজনেস ব্যাংক অ্যাকাউন্ট", desc: "ব্যক্তিগত bKash নয় — কর্পোরেট একাউন্টে পেমেন্ট" },
  { icon: "👨‍💻", title: "রিয়েল ডেভেলপার টিম", desc: "একজন ফ্রিল্যান্সার নয়, পূর্ণাঙ্গ টিম কাজ করে" },
  { icon: "📘", title: "ফেসবুক বিজনেস পেজ", desc: "পাবলিক পেজ, রিভিউ ও হিস্ট্রি সবই দেখা যায়" },
  { icon: "✅", title: "CEO-র ভেরিফায়েড প্রোফাইল", desc: "ফেসবুক ও লিংকডইনে ভেরিফায়েড, রিয়েল আইডেন্টিটি" },
  { icon: "🎥", title: "১২,০০০+ সাবস্ক্রাইবার", desc: "২০০+ পাবলিক ভিডিও — কাজ, প্রসেস সব স্বচ্ছ" },
  { icon: "🔒", title: "পেমেন্টের আগেই ড্যাশবোর্ড চেক করার সুযোগ", desc: "কাজ বুঝে পেমেন্ট — ব্লক করে পালানোর সুযোগ নেই" },
];

const faqs = [
  {
    q: "টাকা দেওয়ার পর যদি যোগাযোগ বন্ধ করে দেয়?",
    a: "আমাদের বৈধ ট্রেড লাইসেন্স, ফিজিক্যাল অফিস, বিজনেস ব্যাংক অ্যাকাউন্ট এবং ১২,০০০+ সাবস্ক্রাইবারের পাবলিক ইউটিউব চ্যানেল আছে — লুকিয়ে থাকার কোনো সুযোগ নেই। CEO-র প্রোফাইলও ভেরিফায়েড, ফেসবুক ও লিংকডইনে যাচাই করে দেখতে পারবেন।",
  },
  {
    q: "আমাকে কি বাংলাদেশে থাকতে হবে?",
    a: "না। আপনি যেখানেই থাকুন — UAE, সৌদি, মালয়েশিয়া, সিঙ্গাপুর — আমরা রিমোটলি পুরো সেটআপ করে দিই। শুধু WhatsApp-এ যোগাযোগ রাখলেই চলবে।",
  },
  {
    q: "ইয়ারলি প্যাকেজে আসলে কত সাশ্রয় হয়?",
    a: "Pro প্ল্যান মাসিক ৳১০,০০০, অর্থাৎ ১২ মাসে ৳১,২০,০০০। ইয়ারলি নিলে দিতে হবে মাত্র ৳৬০,০০০ — সরাসরি ৬ মাসের পেমেন্ট বেঁচে যায়। একই হিসাব Basic প্যাকেজেও প্রযোজ্য।",
  },
  {
    q: "সাইট তৈরি হতে কতদিন লাগে?",
    a: "সাধারণত সাইন-আপের পর কয়েক দিনের মধ্যেই আপনার সাইট লাইভ হয়ে যায়। ডিজাইন, কন্টেন্ট, ডোমেইন — সব আমরা হ্যান্ডেল করি।",
  },
  {
    q: "পেমেন্টের আগে কি কাজ যাচাই করতে পারব?",
    a: "অবশ্যই। পেমেন্টের আগেই আমাদের ড্যাশবোর্ড ফ্রি টেস্ট করতে পারবেন, আমাদের আগের ২০+ লাইভ প্রজেক্ট দেখতে পারবেন, ইউটিউবে ২০০+ ভিডিও দেখতে পারবেন — বিশ্বাস তৈরি না হলে আমরা কাজ শুরুই করি না।",
  },
  {
    q: "পেমেন্ট কিভাবে করব?",
    a: "বাংলাদেশ থেকে bKash, Nagad বা ব্যাংক ট্রান্সফারে পেমেন্ট করতে পারবেন। আর আপনি যদি প্রবাসে থাকেন, কার্ড, Google Pay বা Apple Pay দিয়েও পেমেন্ট করা যায় (DodoPay দিয়ে সিকিউর প্রসেস করা) — ড্যাশবোর্ডের ভিতরেই একটা সাবস্ক্রিপশন অপশন আছে, সেখান থেকে অটোমেটিক পেমেন্ট সেটআপ করে নিতে পারবেন।",
    img: { src: "/dashboard-shots/subscription.png", alt: "ড্যাশবোর্ডের সাবস্ক্রিপশন ও পেমেন্ট পেজ" },
  },
];

// Static screenshots captured once and stored under /public/portfolio — filename
// is the bare domain so it's obvious which shot belongs to which site.
const portfolio = [
  "a-faq.com",
  "alsadafperfumes.com",
  "endeavorrenovation.sg",
  "dkintlsg.com",
  "dubaideepcleaning.ae",
  "bagdaddecor.com",
  "excellenthospitality.ae",
  "hajjji.com",
  "hasanflooringkl.com",
  "homayrahafcha.ae",
  "hvactechnicianksa.com",
  "hwmovers.com",
  "kuraskksa.com",
  "makkahakramlaundry.com",
  "mepcontracting.net",
  "noorhilalbuild.com",
  "samconsg.com",
  "skrarif.com",
  "sunsoonsg.com",
  "uniquerenovationmy.com",
];

// Real screenshots of our own dashboard — captured via
// scripts/capture-dashboard-shots.cjs — live under /public/dashboard-shots.
const dashboardTour = [
  {
    img: "dashboard-home.png",
    title: "সাইনআপের পরই আপনার নিজের ড্যাশবোর্ড",
    desc: "পেজ, অর্ডার, ইউজার — সব একনজরে",
  },
  {
    img: "onboarding-wizard.png",
    title: "৩-স্টেপ সেটআপ উইজার্ড",
    desc: "লোগো, ফ্যাভিকন, সাইট ডিটেইলস — এক মিনিটেই শেষ",
  },
  {
    img: "page-block-editor.png",
    title: "ড্র্যাগ-ড্রপ পেজ বিল্ডার",
    desc: "রেডিমেড সেকশন বসিয়ে নিজের মতো সাজান, কোড লাগে না",
  },
  {
    img: "scheduler-calendar.png",
    title: "কন্টেন্ট শিডিউলার — ক্যালেন্ডার ভিউ",
    desc: "সোশ্যাল মিডিয়া পোস্ট প্ল্যান করুন মাসের জন্য",
  },
  {
    img: "crm.png",
    title: "বিল্ট-ইন CRM",
    desc: "লিড ও কাস্টমার এক জায়গায় ট্র্যাক করুন",
  },
  {
    img: "invoices.png",
    title: "ইনভয়েসিং",
    desc: "প্রফেশনাল ইনভয়েস বানান কয়েক ক্লিকে",
  },
  {
    img: "bookings.png",
    title: "বুকিং সিস্টেম",
    desc: "কাস্টমার সরাসরি অ্যাপয়েন্টমেন্ট নিতে পারবে",
  },
  {
    img: "subscription.png",
    title: "সাবস্ক্রিপশন ও পেমেন্ট",
    desc: "USD বা BDT — যেভাবে সুবিধা, সেভাবে পেমেন্ট",
  },
];

const chapters = [
  ["00:00", "পরিচয়"],
  ["00:05", "অভিজ্ঞতা"],
  ["00:52", "বিজনেস প্রসেস আউটসোর্সিং"],
  ["01:13", "ওয়েবসাইট ব্যবহার নিয়ে প্রবলেম"],
  ["02:02", "ওয়েবসাইট করতে গড়িমসি"],
  ["02:32", "মার্কেটিং না ওয়েবসাইট করি"],
  ["02:56", "ওয়েবসাইট না থাকলে কাজের চান্স কম"],
  ["03:07", "ডেভেলপমেন্ট এ সময় কেমন লাগে"],
  ["03:24", "কি কি ইনফর্মেশন লাগবে?"],
  ["04:51", "ওয়েবসাইট প্রাইসিং/প্যাকেজ"],
  ["05:50", "হোয়াটসঅ্যাপ গ্রুপ মেসেজ"],
  ["06:02", "মোবাইল রেস্পন্সিভ ডিজাইন"],
  ["06:10", "কাজের রিভিশন"],
  ["06:48", "আমাদের টিম ও ভ্যালিডিটি"],
  ["07:16", "হ্যান্ডওভার এবং ভিডিও কোর্স"],
  ["07:44", "প্রিমিয়াম প্যাকেজ"],
  ["08:33", "প্রিমিয়াম আপডেট মেইনটেন্যান্স"],
  ["09:14", "পেমেন্ট সিকিউরিটি"],
  ["10:14", "পেমেন্ট কিভাবে?"],
  ["10:21", "আমাদের এক্সপার্টিজ"],
  ["10:36", "কাজ করতে চাইলে সময় নষ্ট করবেন না"],
  ["11:36", "কেন দ্রুত স্টার্ট করা বেস্ট?"],
  ["13:54", "ভবিষ্যতে যেন আফসোস না থাকে"],
  ["14:17", "আজই শুরু করুন"],
];

export default function BangladeshiExpatLandingPage() {
  return (
    <div className={`${bangla.variable} font-[family-name:var(--font-bangla)] bg-white text-slate-900`}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-orange-900/20">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Passive Coder" className="h-8 w-auto brightness-0 invert" />
          </Link>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <WaIcon />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-950 via-gray-950 to-gray-950 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(251,146,60,0.22),_transparent_65%)]" />
        <div className="mx-auto max-w-5xl px-5 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center">
          <span className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full border border-orange-500/20 mb-6">
            প্রবাসী কন্ট্রাক্টর ও সার্ভিস ব্যবসার জন্য
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
            প্রবাসে বসে ব্যবসা করেন?{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
              ওয়েবসাইটটাও থাকুক প্রফেশনাল
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            ১৬ বছরের অভিজ্ঞ ডেভেলপার টিম নিয়ে কাজ করছি — শুধু কোড লিখি না, প্রবাসী
            ব্যবসার আসল সমস্যাগুলো বুঝি। সংযুক্ত আরব আমিরাত, সৌদি আরব, ওমান, কাতার,
            মালয়েশিয়া আর সিঙ্গাপুরে বসে থাকা কন্ট্রাক্টর, HVAC, রেনোভেশন আর
            হ্যান্ডিম্যান ব্যবসায়ীরা প্রতিদিন কাস্টমার হারাচ্ছেন শুধু একটা কারণে —
            গুগলে সার্চ করলে তাদের কোনো অস্তিত্ব খুঁজে পাওয়া যায় না। এজেন্সিকে হাজার
            ডলার না দিয়ে, সরাসরি আমাদের সাথে কাজ করুন।
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <CtaButtons dark />
            <span className="text-xs sm:text-sm text-gray-400">
              পেমেন্টের আগেই ড্যাশবোর্ড টেস্ট করুন — কোনো বাধ্যবাধকতা নেই
            </span>
          </div>

          {/* Hero video */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-black/40 aspect-video">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/085_ItLW4jY"
                title="Passive Coder — আমাদের ওয়েবসাইট ডেভেলপমেন্ট সার্ভিস সম্পর্কে বিস্তারিত"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <details className="mt-4 text-left bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold text-orange-400">
                ভিডিওতে যা যা আছে (টাইমস্ট্যাম্প) — দেখুন
              </summary>
              <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm text-gray-300">
                {chapters.map(([t, label]) => (
                  <div key={t} className="flex gap-2">
                    <span className="text-orange-400 font-mono shrink-0">{t}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </details>
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
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 transition-colors px-4 py-6 text-center"
            >
              <span className="text-3xl">{t.emoji}</span>
              <span className="text-sm font-semibold text-slate-700">{t.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {countries.map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600"
            >
              <Image
                src={`https://flagcdn.com/${c.code}.svg`}
                alt={c.name}
                width={20}
                height={14}
                className="rounded-sm border border-slate-100"
                unoptimized
              />
              {c.name}
            </span>
          ))}
        </div>
      </section>

      {/* ── Portfolio ────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            আমাদের তৈরি কিছু প্রবাসী সার্ভিস বিজনেসের ওয়েবসাইট
          </h2>
          <p className="text-center text-slate-500 mb-10">
            এগুলো সবই লাইভ সাইট, বাস্তব ক্লায়েন্টদের জন্য তৈরি
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {portfolio.map((domain) => (
              <a
                key={domain}
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {/* Static screenshots live in /public/portfolio/<domain>.png */}
                  <Image
                    src={`/portfolio/${domain}.png`}
                    alt={domain}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="px-3 py-2 text-center text-xs sm:text-sm font-semibold text-slate-700 truncate">
                  {domain}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard tour ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          পেমেন্টের আগেই দেখে নিন — ভেতরে আসলে কী পাচ্ছেন
        </h2>
        <p className="text-center text-slate-500 max-w-2xl mx-auto mb-10">
          এগুলো আমাদের নিজের প্রোডাক্টের আসল স্ক্রিনশট — কোনো মকআপ না। ফ্রি
          ড্যাশবোর্ড টেস্ট করেও নিজে হাতে-কলমে দেখতে পারবেন।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {dashboardTour.map((d) => (
            <div key={d.img} className="rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <div className="relative aspect-[16/10] bg-slate-100">
                <Image
                  src={`/dashboard-shots/${d.img}`}
                  alt={d.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-1">{d.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <DashboardIcon />
            নিজে হাতে-কলমে টেস্ট করুন
          </Link>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20 text-center">
          <span className="inline-block rounded-full bg-orange-500/10 text-orange-400 text-xs sm:text-sm font-bold px-4 py-1.5 border border-orange-500/20 mb-5">
            ইয়ারলি অফার — ৬ মাস ফ্রি
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold mb-10">
            আপনার বাজেট যা-ই হোক, একটা প্যাকেজ আছে
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {/* Basic — primary */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 sm:p-8 flex flex-col">
              <span className="text-sm font-bold text-gray-400 mb-1">Basic প্যাকেজ</span>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-gray-500 line-through text-base">৳৬০,০০০</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white">৳৩০,০০০</span>
                <span className="text-gray-400 text-sm mb-1">/বছর</span>
              </div>
              <p className="text-orange-400 text-sm font-semibold mb-6">
                মাসিক ৳৫,০০০ হিসেবে — ৬ মাস ফ্রি
              </p>
              <div className="space-y-2.5 mb-8 flex-1">
                {basicFeatures.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckIcon className="fill-orange-400" />
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Basic নিয়ে জানতে চাই
              </a>
            </div>

            {/* Pro — highlighted */}
            <div className="relative rounded-2xl border-2 border-orange-500 bg-gradient-to-b from-orange-500/10 to-rose-500/5 p-6 sm:p-8 flex flex-col shadow-2xl shadow-orange-900/30">
              <span className="absolute -top-3 left-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                সবচেয়ে জনপ্রিয়
              </span>
              <span className="text-sm font-bold text-orange-300 mb-1">Pro প্যাকেজ</span>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-gray-400 line-through text-base">৳১,২০,০০০</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white">৳৬০,০০০</span>
                <span className="text-gray-400 text-sm mb-1">/বছর</span>
              </div>
              <p className="text-orange-300 text-sm font-semibold mb-6">
                মাসিক ৳১০,০০০ হিসেবে — ৬ মাস ফ্রি
              </p>
              <div className="space-y-2.5 mb-8 flex-1">
                {proFeatures.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckIcon className="fill-orange-400" />
                    <span className="text-sm text-gray-200">{f}</span>
                  </div>
                ))}
              </div>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-bold px-6 py-3 rounded-xl transition-all"
              >
                Pro নিয়ে জানতে চাই
              </a>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <CtaButtons dark />
          </div>
        </div>
      </section>

      {/* ── Trust section ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          কেন আমাদের বিশ্বাস করবেন?
        </h2>
        <p className="text-center text-slate-500 max-w-2xl mx-auto mb-10">
          প্রবাসে অনেকেই টাকা দিয়ে প্রতারিত হয়েছেন — কথিত ডেভেলপার টাকা নিয়ে
          যোগাযোগ বন্ধ করে দিয়েছে। আমরা বুঝি এই ভয়টা কেন আসে, তাই আমাদের ব্যবসার
          সব প্রমাণ খোলাখুলি দিচ্ছি।
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {trustPoints.map((t) => (
            <div
              key={t.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center"
            >
              <span className="text-3xl block mb-2">{t.icon}</span>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{t.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust videos ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            কেন ব্যবসার জন্য ওয়েবসাইট মাস্ট-হ্যাভ
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <div className="relative aspect-video">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/XqPdLxdG_gI"
                  title="আপনার ব্যবসার জন্য ওয়েবসাইট কেন প্রয়োজন?"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <p className="p-4 text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-1">
                  আপনার ব্যবসার জন্য ওয়েবসাইট কেন প্রয়োজন?
                </span>
                ওয়েবসাইটের গুরুত্ব, সঠিক ব্যবহার, আর কিভাবে এটা ব্র্যান্ড ভ্যালু ও
                কাস্টমার ট্রাস্ট বাড়ায়।
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <div className="relative aspect-video">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/ndN25ic4jyE"
                  title="প্রবাসী ব্যবসায়ীদের জন্য ওয়েবসাইটের আসল বেনিফিট"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <p className="p-4 text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-1">
                  প্রবাসী ব্যবসায়ীদের জন্য ওয়েবসাইটের আসল বেনিফিট
                </span>
                শুধু Google My Business বা Facebook পেজ কখনোই ওয়েবসাইটের জায়গা নিতে
                পারে না — কেন, তা বিস্তারিত বলা হয়েছে।
              </p>
            </div>
          </div>
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
              <div className={f.img ? "grid sm:grid-cols-[1fr_auto] gap-4 items-start" : ""}>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{f.a}</p>
                {f.img && (
                  <div className="relative w-full sm:w-56 aspect-[16/10] rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <Image src={f.img.src} alt={f.img.alt} fill sizes="224px" className="object-cover object-top" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-950 via-gray-950 to-gray-950 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(251,146,60,0.22),_transparent_65%)]" />
        <div className="mx-auto max-w-2xl px-5 py-14 sm:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            আজই আপনার ব্যবসার জন্য প্রফেশনাল ওয়েবসাইট শুরু করুন
          </h2>
          <p className="text-gray-300 mb-7 text-sm sm:text-base">
            WhatsApp-এ মেসেজ দিন, আমরা দ্রুত রিপ্লাই দেব ইনশাআল্লাহ। অথবা পেমেন্টের
            আগেই ড্যাশবোর্ড টেস্ট করে দেখুন — বিশ্বাস তৈরি না হলে আমরা কাজই শুরু করি না।
          </p>
          <div className="flex justify-center">
            <CtaButtons dark />
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 py-6">
        Passive Coder — passivecoder.com
      </footer>

      {/* ── Sticky mobile CTA bar ────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 flex shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <Link
          href="/onboarding"
          className="flex-1 bg-gray-900 text-white font-bold text-center py-3.5 flex items-center justify-center gap-1.5 text-sm"
        >
          ফ্রি ড্যাশবোর্ড টেস্ট
        </Link>
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#25D366] text-white font-bold text-center py-3.5 flex items-center justify-center gap-1.5 text-sm"
        >
          <WaIcon />
          WhatsApp
        </a>
      </div>
      <div className="sm:hidden h-14" />
    </div>
  );
}

function CtaButtons({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <Link
        href="/onboarding"
        className={
          dark
            ? "inline-flex items-center gap-2.5 bg-white text-gray-900 font-bold text-base sm:text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            : "inline-flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        }
      >
        <DashboardIcon />
        ফ্রি ড্যাশবোর্ড টেস্ট করুন
      </Link>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all duration-200"
      >
        <WaIcon />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-base sm:text-lg">WhatsApp</span>
          <span className="text-xs sm:text-sm font-normal opacity-90">{WA_DISPLAY}</span>
        </span>
      </a>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
      <rect x="3" y="3" width="7" height="9" rx="1.5" fill="currentColor" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" fill="currentColor" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" fill="currentColor" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function WaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 shrink-0 fill-white">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/>
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={`w-5 h-5 shrink-0 mt-0.5 ${className}`}>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}
