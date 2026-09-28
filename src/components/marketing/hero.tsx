import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { ArrowRight, ShieldCheck, Zap, Headphones, MessageCircle, CalendarCheck } from "lucide-react";

interface Settings {
  hero_headline?: string;
  hero_subheadline?: string;
  hero_cta_text?: string;
  hero_cta_url?: string;
  hero_secondary_cta?: string;
  stat_sites?: string;
  stat_businesses?: string;
  stat_uptime?: string;
}

const WHATSAPP = "https://wa.me/8801678669699?text=" + encodeURIComponent("Hi Passive Coder, I want a website for my business.");
// Royalty-free (Unsplash licence): a shop owner at her counter — the customer
// this page is for, not a stock "tech" image.
const HERO_PHOTO = "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1400&q=75&auto=format&fit=crop";

/**
 * Homepage hero. Outcome-first for local service businesses: what they get
 * (customers from Google and WhatsApp), who does the work (we do), and proof
 * next to it — a real client site on the phone. Copy is editable from
 * Super Admin > Homepage (homepage_settings); these are fallbacks.
 */
export default function HeroSection({ settings }: { settings: Settings | null }) {
  const s = settings ?? {};
  return (
    <section className="relative overflow-hidden bg-[#05060a]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[640px] h-[640px] bg-orange-600/20 rounded-full blur-[130px]" />
        <div className="absolute top-20 right-0 w-[520px] h-[520px] bg-rose-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 lg:pt-24 lg:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 bg-white/[0.06] text-orange-300 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Websites for local service businesses
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.6rem] font-bold text-white leading-[1.06] tracking-tight">
            {s.hero_headline ? (
              s.hero_headline
            ) : (
              <>
                More customers from Google and WhatsApp.{" "}
                <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                  Your website, done for you.
                </span>
              </>
            )}
          </h1>

          <p className="mt-6 text-lg text-slate-300/90 leading-relaxed max-w-xl">
            {s.hero_subheadline ??
              "We build and run a professional website for your business, with WhatsApp enquiries, online booking and a shop built in. You serve customers. We handle the tech."}
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              href={s.hero_cta_url ?? "/onboarding"}
              className="group inline-flex items-center justify-center gap-2 bg-white text-slate-950 font-semibold px-7 py-4 rounded-xl shadow-2xl shadow-orange-950/40 transition-transform hover:-translate-y-0.5"
            >
              {s.hero_cta_text ?? "Get my website"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold px-7 py-4 rounded-xl transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              {s.hero_secondary_cta && s.hero_secondary_cta !== "See Pricing" ? s.hero_secondary_cta : "Talk to us on WhatsApp"}
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-emerald-400" /> Live in hours, not weeks</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Card, bKash &amp; Nagad accepted</span>
            <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-emerald-400" /> Real people on support</span>
          </div>

          <div className="mt-10 flex items-center gap-6 border-t border-white/[0.08] pt-6">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{s.stat_sites ?? "17+"}</div>
              <div className="text-xs text-slate-500">live client websites</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{s.stat_businesses ?? "8"}</div>
              <div className="text-xs text-slate-500">countries</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{s.stat_uptime ?? "99.9%"}</div>
              <div className="text-xs text-slate-500">uptime</div>
            </div>
          </div>
        </div>

        {/* Visual: real customer photo + a real client site on the phone */}
        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
          <div className="relative aspect-[4/5] sm:aspect-[5/5] rounded-[28px] overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60">
            <Image src={HERO_PHOTO} alt="Small business owner serving a customer" fill priority sizes="(min-width:1024px) 45vw, 90vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Phone with a real client site */}
          <div className="absolute -left-4 sm:-left-10 bottom-[-28px] w-[138px] sm:w-[170px] rounded-[26px] bg-black p-1.5 ring-1 ring-white/15 shadow-2xl shadow-black/70">
            <div className="relative aspect-[9/19] rounded-[20px] overflow-hidden bg-white">
              <Image src="/images/clients/emiratescurtain.com-m.jpg" alt="A client website built on Passive Coder, on a phone" fill sizes="170px" className="object-cover object-top" />
            </div>
          </div>

          {/* WhatsApp enquiry */}
          <div className="absolute right-3 sm:-right-6 top-6 w-[230px] rounded-2xl bg-white p-3.5 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
              <MessageCircle className="w-3.5 h-3.5" /> New WhatsApp enquiry
            </div>
            <p className="mt-1.5 text-sm text-slate-800 leading-snug">&ldquo;Hi, saw your website. Can you come for a quote tomorrow?&rdquo;</p>
          </div>

          {/* Booking */}
          <div className="absolute right-3 sm:-right-4 bottom-8 flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-xl shadow-black/40">
            <span className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">Booking confirmed</div>
              <div className="text-xs text-slate-500">Tomorrow, 10:30 AM</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
