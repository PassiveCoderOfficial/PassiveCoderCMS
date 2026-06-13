"use client";

import { Star, Quote } from "lucide-react";

interface Testimonial { name: string; location: string; text: string; rating: number; initials: string }
interface TestimonialsData { testimonials: Testimonial[]; primaryColor: string; accentHex: string; secondaryColor: string }

// ── Variant 1: Quote cards grid ───────────────────────────────────────────────
export function TestimonialsCards({ d }: { d: TestimonialsData }) {
  return (
    <section className="px-8 py-14" style={{ background: `linear-gradient(135deg, ${d.primaryColor}10, ${d.secondaryColor}18)` }}>
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>Client Stories</div>
        <h2 className="text-2xl font-extrabold text-gray-900">What Our Clients Say</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {d.testimonials.slice(0, 3).map(t => (
          <div key={t.name} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <Quote className="w-5 h-5 mb-3 opacity-20" style={{ color: d.accentHex }} />
            <p className="text-xs text-gray-600 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: d.accentHex }}>
                {t.initials}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">{t.name}</div>
                <div className="text-[10px] text-gray-400">{t.location}</div>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-current text-amber-400" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Variant 2: Full-width dark band with single large quote ───────────────────
export function TestimonialsFullWidth({ d }: { d: TestimonialsData }) {
  const t = d.testimonials[0];
  return (
    <section style={{ backgroundColor: d.primaryColor }} className="px-8 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <Quote className="w-10 h-10 mx-auto mb-6 text-white/20" />
        <p className="text-white text-xl font-light leading-relaxed mb-8 italic">&ldquo;{t?.text}&rdquo;</p>
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: d.accentHex, color: d.primaryColor }}>
            {t?.initials}
          </div>
          <div className="text-left">
            <div className="text-white font-semibold text-sm">{t?.name}</div>
            <div className="text-white/50 text-xs">{t?.location}</div>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {d.testimonials.slice(0, 3).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 3: Editorial pull-quotes — large text, minimal ────────────────────
export function TestimonialsEditorial({ d }: { d: TestimonialsData }) {
  return (
    <section className="bg-stone-50 px-8 py-16 border-y border-stone-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>Testimonials</div>
          <h2 className="text-2xl font-bold text-stone-900" style={{ fontFamily: "Georgia, serif" }}>What Clients Say</h2>
        </div>
        <div className="space-y-8">
          {d.testimonials.slice(0, 2).map((t, i) => (
            <div key={t.name} className={`flex gap-8 items-start ${i % 2 === 1 ? "flex-row-reverse text-right" : ""}`}>
              <div className="text-6xl font-black leading-none mt-2 opacity-10 select-none" style={{ color: d.primaryColor }}>"</div>
              <div className="flex-1">
                <p className="text-stone-700 text-base leading-relaxed mb-4 italic" style={{ fontFamily: "Georgia, serif" }}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2" style={{ justifyContent: i % 2 === 1 ? "flex-end" : "flex-start" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: d.accentHex }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-800">{t.name}</div>
                    <div className="text-xs text-stone-400">{t.location}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 4: Rating-focused cards with large stars ──────────────────────────
export function TestimonialsRatings({ d }: { d: TestimonialsData }) {
  return (
    <section className="bg-white px-8 py-14">
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>Reviews</div>
        <h2 className="text-2xl font-extrabold text-gray-900">Trusted by Our Clients</h2>
        <div className="flex items-center justify-center gap-1 mt-3">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current text-amber-400" />)}
          <span className="ml-2 text-sm font-bold text-gray-700">4.9 / 5.0</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {d.testimonials.slice(0, 4).map(t => (
          <div key={t.name} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex gap-0.5 mb-3">
              {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-400" />)}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: d.accentHex }}>
                {t.initials}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">{t.name}</div>
                <div className="text-[10px] text-gray-400">{t.location}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
