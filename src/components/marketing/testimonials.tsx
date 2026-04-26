import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  business: string;
  quote: string;
  rating?: number;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { name: "Sarah M.", business: "Metro Plumbing Co.", quote: "Got our site up in a day. Customers actually find us on Google now. Best $199 I've spent.", rating: 5 },
  { name: "James K.", business: "Keller's Auto Repair", quote: "The booking form alone has brought in 15 new customers this month. Incredible value.", rating: 5 },
  { name: "Priya N.", business: "Glow Beauty Salon", quote: "I changed our pricing page myself without calling anyone. That never happened with our old website.", rating: 5 },
  { name: "Carlos R.", business: "RC Landscaping", quote: "Our site looks as good as companies 10x our size. Clients always mention how professional it looks.", rating: 5 },
  { name: "Lisa T.", business: "TrueClean Services", quote: "Support actually responded within an hour. They helped me set up the whole thing.", rating: 5 },
  { name: "Ahmed F.", business: "First Choice Dental", quote: "Switched from a $300/month agency. Same quality, fraction of the cost, and I control everything.", rating: 5 },
];

export default function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const items = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Local businesses love CMS Studio</h2>
          <p className="mt-4 text-gray-600 text-lg">Real results from real business owners.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 text-sm leading-relaxed mb-4">"{t.quote}"</blockquote>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                <div className="text-xs text-gray-500">{t.business}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
