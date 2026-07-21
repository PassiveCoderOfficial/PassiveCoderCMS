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
  { value: "500+", label: "Active websites live today" },
  { value: "$240", label: "Starting price — yearly, all-in" },
  { value: "24h", label: "Average time to go live" },
];

export default function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const items = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <div className="flex justify-center gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Real businesses, real results</h2>
          <p className="mt-4 text-gray-600 text-lg">Don&apos;t take our word for it — hear from business owners who use Passive Coder every day.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {STATS.map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all relative">
              {t.result && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-100">
                    ✓ {t.result}
                  </span>
                </div>
              )}

              <Quote className="w-5 h-5 text-orange-200 mb-4" />

              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-current" />
                ))}
              </div>

              <blockquote className="text-gray-700 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</blockquote>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-rose-100 border border-orange-100 flex items-center justify-center text-base">
                  {t.country ?? "🌐"}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.business}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
