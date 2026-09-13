import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles, Clock, Shield } from "lucide-react";

interface Settings {
  hero_cta_text?: string;
  hero_cta_url?: string;
  cta_headline?: string;
  cta_subheadline?: string;
}

const URGENCY_ITEMS = [
  "Your competitor might already be on page 1 of Google",
  "Every day offline is a day customers can't find you",
  "Setup takes less than 2 hours — not weeks",
];

export default function CtaSection({ settings }: { settings: Settings | null }) {
  return (
    <section className="py-24 relative overflow-hidden bg-[#05060a] border-t border-white/[0.05]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Join 17+ businesses already live
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
          {settings?.cta_headline ?? (
            <>
              Your business deserves<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                a website that actually works
              </span>
            </>
          )}
        </h2>

        <p className="mt-5 text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          {settings?.cta_subheadline ?? "Don't let another week go by with customers landing on your competitor's site instead of yours. Launch with Passive Coder today."}
        </p>

        {/* Urgency points */}
        <div className="mt-8 space-y-2.5">
          {URGENCY_ITEMS.map(item => (
            <div key={item} className="flex items-center justify-center gap-2.5 text-sm text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link
            href={settings?.hero_cta_url ?? "/onboarding"}
            className="group inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-semibold px-10 py-4 rounded-xl shadow-2xl shadow-indigo-950/40 transition-all hover:scale-[1.02] text-base"
          >
            {settings?.hero_cta_text ?? "Get Started"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/contact?dept=sales"
            className="inline-flex items-center gap-2 border border-white/[0.12] text-slate-300 font-medium px-10 py-4 rounded-xl hover:border-white/25 hover:text-white transition-colors text-base"
          >
            Talk to Sales First
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Card, bKash &amp; Nagad accepted</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-cyan-400" /> Live in 24 hours</span>
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-violet-400" /> Cancel anytime</span>
        </div>

        {/* Social proof mini */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <div className="flex -space-x-2">
            {["🇦🇪", "🇸🇬", "🇲🇾", "🇶🇦", "🇸🇦"].map((flag, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/[0.05] border-2 border-[#05060a] flex items-center justify-center text-sm">{flag}</div>
            ))}
          </div>
          <span className="text-slate-500 text-sm ml-2">17+ businesses launched across 8 countries</span>
        </div>
      </div>
    </section>
  );
}
