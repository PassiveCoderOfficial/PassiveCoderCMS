import Link from "next/link";
import { ArrowRight, Star, CheckCircle, Code2 } from "lucide-react";

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
];

export default function HeroSection({ settings }: { settings: Settings | null }) {
  const s = settings ?? {};
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-rose-50 pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-50 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-full border border-orange-200">
            <Star className="w-3 h-3 fill-current" />
            Built by Passive Coder · Trusted by 17+ Businesses Worldwide
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight max-w-4xl mx-auto">
          {s.hero_headline ?? (
            <>
              Beautiful Websites for{" "}
              <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                Local Businesses
              </span>
            </>
          )}
        </h1>

        <p className="text-center mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {s.hero_subheadline ?? "Launch your professional website in minutes. Built by Passive Coder — a team that has shipped 17+ real businesses across 8 countries."}
        </p>

        {/* Business type pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {BUSINESS_TYPES.map(b => (
            <span key={b} className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
              {b}
            </span>
          ))}
          <span className="bg-white border border-dashed border-orange-300 text-orange-500 text-xs font-medium px-3 py-1 rounded-full">+ more</span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link
            href={s.hero_cta_url ?? "/onboarding"}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-orange-200 transition-all hover:scale-105 hover:shadow-orange-300 text-base"
          >
            {s.hero_cta_text ?? "Start Building Free"}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors text-base"
          >
            {s.hero_secondary_cta ?? "See Pricing"}
          </a>
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 7-day free trial</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Cancel anytime</span>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
          {[
            { value: s.stat_sites ?? "17+", label: "Live websites" },
            { value: s.stat_businesses ?? "8", label: "Countries served" },
            { value: s.stat_uptime ?? "99.9%", label: "Uptime SLA" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Browser mockup */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl shadow-orange-100 border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center border border-gray-200">
                yourbusiness.com
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-8 sm:p-12">
              <div className="text-white">
                <div className="text-xs font-bold uppercase tracking-widest text-orange-200 mb-2">Premier Cleaning Co.</div>
                <div className="text-2xl sm:text-3xl font-extrabold mb-3">Professional Cleaning Services</div>
                <div className="text-orange-100 text-sm mb-6 max-w-xs">Licensed · Insured · 5-Star Rated · Serving Dubai & Abu Dhabi</div>
                <div className="flex gap-3">
                  <div className="bg-white text-orange-600 text-xs font-bold px-5 py-2.5 rounded-xl shadow">Book Now</div>
                  <div className="border border-orange-300 text-white text-xs font-bold px-5 py-2.5 rounded-xl">Our Services</div>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {["Deep Cleaning", "Move-in/out", "Office Cleaning"].map(s => (
                <div key={s} className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-400 rounded-lg mx-auto mb-2" />
                  <div className="text-xs font-semibold text-gray-700">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
