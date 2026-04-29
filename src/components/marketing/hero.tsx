import Link from "next/link";
import { ArrowRight, Star, CheckCircle, TrendingUp, Award, Globe } from "lucide-react";

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

const BUSINESS_TYPES = [
  "Plumbers", "Salons", "Restaurants", "Contractors",
  "Dentists", "Gyms", "Law Firms", "Real Estate",
  "Cleaning", "HVAC", "Fit-out", "Renovation",
  "Photography", "Flooring", "Painting", "Landscaping",
];

const TRUST_LOGOS = [
  { emoji: "🇦🇪", label: "UAE" },
  { emoji: "🇸🇬", label: "Singapore" },
  { emoji: "🇲🇾", label: "Malaysia" },
  { emoji: "🇶🇦", label: "Qatar" },
  { emoji: "🇸🇦", label: "Saudi Arabia" },
  { emoji: "🇧🇩", label: "Bangladesh" },
  { emoji: "🇮🇳", label: "India" },
  { emoji: "🌐", label: "+ more" },
];

export default function HeroSection({ settings }: { settings: Settings | null }) {
  const s = settings ?? {};
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 pt-16 pb-0 sm:pt-20">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-rose-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 text-xs font-bold px-5 py-2.5 rounded-full border border-orange-500/20">
            <Star className="w-3.5 h-3.5 fill-current" />
            17+ live businesses · 8 countries · built by real developers
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl lg:text-[4rem] font-extrabold text-white leading-[1.1] tracking-tight max-w-4xl mx-auto">
          {s.hero_headline ? (
            <span>{s.hero_headline}</span>
          ) : (
            <>
              Stop Losing Customers<br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                to Competitors with Better Websites
              </span>
            </>
          )}
        </h1>

        <p className="text-center mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {s.hero_subheadline ?? "Passive Coder builds professional websites for local service businesses — fast, affordable, and actually designed to convert visitors into paying customers."}
        </p>

        {/* Value props */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-6">
          {["Launches in 24 hours", "Built for local service businesses", "Real humans on support", "No lock-in"].map(v => (
            <span key={v} className="flex items-center gap-1.5 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> {v}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link
            href={s.hero_cta_url ?? "/onboarding"}
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-bold px-8 py-4 rounded-xl shadow-2xl shadow-orange-900/50 transition-all hover:scale-105 text-base"
          >
            {s.hero_cta_text ?? "Start Your Free Trial"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 font-semibold px-8 py-4 rounded-xl hover:border-orange-400/30 hover:bg-orange-500/5 hover:text-white transition-all text-base"
          >
            {s.hero_secondary_cta ?? "See Pricing"}
          </a>
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 7-day free trial</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Cancel anytime</span>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-3 gap-4 max-w-xl mx-auto">
          {[
            { value: s.stat_sites ?? "17+", label: "Live websites", icon: Globe },
            { value: s.stat_businesses ?? "8", label: "Countries", icon: TrendingUp },
            { value: s.stat_uptime ?? "99.9%", label: "Uptime SLA", icon: Award },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <Icon className="w-4 h-4 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Countries */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10 pb-10">
          <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">Serving businesses in</span>
          {TRUST_LOGOS.map(({ emoji, label }) => (
            <span key={label} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-full text-xs text-gray-400">
              <span className="text-base leading-none">{emoji}</span> {label}
            </span>
          ))}
        </div>

        {/* Browser mockup */}
        <div className="relative mt-4 -mx-4 sm:mx-0">
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-t-2xl border border-gray-700/50 overflow-hidden shadow-2xl shadow-black/60">
              <div className="bg-gray-800/80 px-4 py-3 flex items-center gap-2 border-b border-gray-700/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 bg-gray-700/60 rounded-md px-3 py-1 text-xs text-gray-400 text-center border border-gray-600/30">
                  yourbusiness.com
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-rose-700 p-8 sm:p-12">
                <div className="max-w-lg">
                  <div className="text-xs font-bold uppercase tracking-widest text-orange-200 mb-3">Premier Cleaning Co. · Dubai, UAE</div>
                  <div className="text-2xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">Professional Cleaning Services</div>
                  <div className="text-orange-100 text-sm mb-1">Licensed · Insured · 5-Star Rated</div>
                  <div className="text-orange-200 text-xs mb-6">Serving Dubai, Abu Dhabi & Sharjah · Available 7 days</div>
                  <div className="flex gap-3">
                    <div className="bg-white text-orange-700 text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg">Book Now</div>
                    <div className="border border-orange-300/60 text-white text-xs font-semibold px-6 py-2.5 rounded-xl">Our Services</div>
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex -space-x-1.5">
                      {["bg-amber-400", "bg-orange-400", "bg-rose-400", "bg-pink-400", "bg-red-400"].map((c, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-orange-600`} />
                      ))}
                    </div>
                    <span className="text-orange-200 text-xs">★★★★★ 4.9 · 200+ happy customers</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-6 grid grid-cols-4 gap-3">
                {["Deep Cleaning", "Move-in/out", "Office", "Post-Reno"].map(svc => (
                  <div key={svc} className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                    <div className="w-7 h-7 bg-gradient-to-br from-orange-100 to-rose-100 rounded-lg mx-auto mb-2" />
                    <div className="text-xs font-semibold text-gray-700">{svc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business types strip */}
      <div className="relative mt-0 border-t border-white/5 bg-white/[0.02] py-4">
        <div className="flex flex-wrap justify-center gap-2 px-4 max-w-6xl mx-auto">
          {BUSINESS_TYPES.map(b => (
            <span key={b} className="bg-white/[0.05] border border-white/[0.08] text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full">
              {b}
            </span>
          ))}
          <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1.5 rounded-full">+ any service business</span>
        </div>
      </div>
    </section>
  );
}
