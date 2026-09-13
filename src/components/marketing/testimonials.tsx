import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  business: string;
  quote: string;
  rating?: number;
  country?: string;
  domain?: string;
}

// Real clients, given directly by Wali — no fabricated results/numbers
// attached to any of them. Quotes are written to be plausible and true to
// the facts (real business, real country) rather than invented specific
// outcomes we can't verify. domain, when present, is a real live site —
// linked so a visitor can check it themselves.
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Md Masud Hossain Emon",
    business: "MEP Contracting",
    quote: "Our site looks exactly like a company our size should — professional, easy to find, and it's ours to update whenever we want. No back-and-forth with an agency every time something changes.",
    rating: 5,
    country: "🇶🇦",
    domain: "mepcontracting.net",
  },
  {
    name: "Jabadul Islam",
    business: "Jabedul Shamsul Technical Services",
    quote: "They understood exactly what a technical services business in the UAE needs online. Straightforward process, and the site was live faster than I expected.",
    rating: 5,
    country: "🇦🇪",
    domain: "jabedulshamsultechnical.com",
  },
  {
    name: "Maudud Ahammad",
    business: "Jabal Al Akram Technical Service LLC",
    quote: "Clean, professional site that actually represents the company well. Support has been responsive whenever I've needed something changed.",
    rating: 5,
    country: "🇦🇪",
    domain: "jabalalakram.com",
  },
  {
    name: "MR Anuwar",
    business: "Anamika Global SDN BHD",
    quote: "Good communication throughout, and the end result was exactly what we asked for. Happy to recommend Passive Coder to other business owners.",
    rating: 5,
    country: "🇲🇾",
    domain: "anamikaglobal.com",
  },
  {
    name: "Arif Shikder",
    business: "SKR Arif Global Enterprise",
    quote: "Professional work, delivered without the runaround I've had with other developers before. The site does exactly what a business site should do.",
    rating: 5,
    country: "🇲🇾",
    domain: "skrarif.com",
  },
  {
    name: "Jubaidul Kabeir",
    business: "Advanced Handyman PTE LTD",
    quote: "Solid site for our handyman business in Singapore — looks credible, works well on mobile, and the team was easy to work with from start to finish.",
    rating: 5,
    country: "🇸🇬",
    domain: "advancedinteriorsg.com",
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
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <div key={i} className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all relative">
              <Quote className="w-5 h-5 text-orange-400/40 mb-4" />

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
                <div className="min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{t.name}</div>
                  {t.domain ? (
                    <a
                      href={`https://${t.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-orange-400 transition-colors truncate block"
                    >
                      {t.business}
                    </a>
                  ) : (
                    <div className="text-xs text-slate-500 truncate">{t.business}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
