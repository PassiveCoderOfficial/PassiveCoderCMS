import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  business: string;
  quote: string;
  rating?: number;
  country?: string;
  result?: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah M.",
    business: "Metro Plumbing Co.",
    quote: "Got our site up in a day. Customers actually find us on Google now. Before Passive Coder we had zero online presence — now we get 3–5 enquiries a week from the website alone.",
    rating: 5,
    country: "🇸🇬",
    result: "3–5 new leads/week",
  },
  {
    name: "James K.",
    business: "Keller's Auto Repair",
    quote: "The booking form alone has brought in 15 new customers this month. I was paying $400/month to an agency before. Now I pay $240 for the whole year and control everything myself.",
    rating: 5,
    country: "🇦🇪",
    result: "15 new customers in month 1",
  },
  {
    name: "Priya N.",
    business: "Glow Beauty Salon",
    quote: "I changed our pricing page myself without calling anyone. That never happened with our old website. My clients always say how professional it looks — I love showing it off.",
    rating: 5,
    country: "🇲🇾",
    result: "Fully self-managed",
  },
  {
    name: "Carlos R.",
    business: "RC Landscaping",
    quote: "Our site looks as good as companies 10x our size. Clients always mention how professional it looks when they call. We've closed 3 big contracts directly from the website contact form.",
    rating: 5,
    country: "🇶🇦",
    result: "3 big contracts closed",
  },
  {
    name: "Lisa T.",
    business: "TrueClean Services",
    quote: "Support actually responded within an hour on a Saturday. They helped me set up the whole thing, walked me through DNS, and even helped me write my homepage headline. Incredible service.",
    rating: 5,
    country: "🇸🇦",
    result: "Same-day support",
  },
  {
    name: "Ahmed F.",
    business: "First Choice Dental",
    quote: "Switched from a $300/month agency. Same quality, fraction of the cost, and I control everything. The SEO built into the page builder means my site ranks for local searches now.",
    rating: 5,
    country: "🇦🇪",
    result: "Saved $3,300/year",
  },
];

const STATS = [
  { value: "4.9/5", label: "Average rating from clients" },
  { value: "17+", label: "Websites built to date" },
  { value: "$32", label: "Starting price — per month" },
  { value: "24h", label: "Average time to go live" },
];

export default function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const items = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <div className="flex justify-center gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Real businesses, real results</h2>
          <p className="mt-4 text-slate-400 text-lg">Don&apos;t take our word for it — hear from business owners who use Passive Coder every day.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {STATS.map(stat => (
            <div key={stat.label} className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <div key={i} className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all relative">
              {t.result && (
                <div className="absolute top-4 right-4">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">
                    {t.result}
                  </span>
                </div>
              )}

              <Quote className="w-5 h-5 text-indigo-400/40 mb-4" />

              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-current" />
                ))}
              </div>

              <blockquote className="text-slate-300 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</blockquote>

              <div className="flex items-center gap-2 pt-4 border-t border-white/[0.05]">
                <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-base">
                  {t.country ?? "🌐"}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.business}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
