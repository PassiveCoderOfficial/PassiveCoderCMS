"use client";

import Image from "next/image";

interface Service { name: string; desc: string; price?: string; icon: string; image?: string }
interface ServicesData {
  services: Service[];
  primaryColor: string;
  accentHex: string;
  secondaryColor: string;
  sectionLabel?: string;
}

// ── Variant 1: Icon cards grid (standard) ────────────────────────────────────
export function ServicesIconGrid({ d }: { d: ServicesData }) {
  return (
    <section className="bg-gray-50 px-8 py-14">
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>{d.sectionLabel ?? "What We Offer"}</div>
        <h2 className="text-2xl font-extrabold text-gray-900">Our Services</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {d.services.slice(0, 6).map(s => (
          <div key={s.name} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group">
            {s.image ? (
              <div className="relative h-28 w-full">
                <Image src={s.image} alt={s.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-4xl" style={{ backgroundColor: `${d.accentHex}12` }}>
                {s.icon}
              </div>
            )}
            <div className="p-4">
              <div className="font-bold text-sm text-gray-900 mb-1 group-hover:text-gray-700">{s.name}</div>
              <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">{s.desc}</div>
              {s.price && <div className="mt-2 text-xs font-bold" style={{ color: d.accentHex }}>{s.price}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Variant 2: Horizontal list with left icon + dividers (electrical, trades) ─
export function ServicesHorizontalList({ d }: { d: ServicesData }) {
  return (
    <section className="bg-white px-8 py-14 border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>{d.sectionLabel ?? "Services"}</div>
          <h2 className="text-2xl font-extrabold text-gray-900">What We Do</h2>
        </div>
        <div className="space-y-0 border border-gray-200 rounded-2xl overflow-hidden">
          {d.services.slice(0, 6).map((s, i) => (
            <div key={s.name} className={`flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors ${i < d.services.length - 1 ? "border-b border-gray-100" : ""}`}>
              {s.image ? (
                <div className="relative w-20 h-16 flex-shrink-0">
                  <Image src={s.image} alt={s.name} fill sizes="80px" className="object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 flex items-center justify-center text-2xl flex-shrink-0 m-2 rounded-xl" style={{ backgroundColor: `${d.accentHex}15` }}>
                  {s.icon}
                </div>
              )}
              <div className="flex-1 min-w-0 py-3 pr-4">
                <div className="font-bold text-sm text-gray-900 mb-0.5">{s.name}</div>
                <div className="text-xs text-gray-500 leading-relaxed line-clamp-1">{s.desc}</div>
              </div>
              {s.price && (
                <div className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg mr-4" style={{ backgroundColor: `${d.accentHex}15`, color: d.accentHex }}>
                  {s.price}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 3: Big image cards — 2 col (renovation, glass, construction) ─────
export function ServicesBigCards({ d }: { d: ServicesData }) {
  const fallbackColors = [d.primaryColor, d.accentHex, d.secondaryColor, `${d.primaryColor}cc`, `${d.accentHex}cc`, d.secondaryColor];
  return (
    <section className="px-8 py-14" style={{ backgroundColor: `${d.primaryColor}08` }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>{d.sectionLabel ?? "What We Offer"}</div>
          <h2 className="text-2xl font-extrabold text-gray-900">Our Services</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {d.services.slice(0, 6).map((s, i) => (
            <div key={s.name} className="rounded-2xl overflow-hidden shadow-md group cursor-pointer">
              {s.image ? (
                <div className="relative h-40 w-full">
                  <Image src={s.image} alt={s.name} fill sizes="400px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white text-xs font-bold tracking-wide">{s.icon} {s.name}</div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-5xl" style={{ backgroundColor: fallbackColors[i % fallbackColors.length] + "33", borderBottom: `4px solid ${fallbackColors[i % fallbackColors.length]}` }}>
                  {s.icon}
                </div>
              )}
              <div className="bg-white p-5">
                {!s.image && <div className="font-bold text-sm text-gray-900 mb-1">{s.name}</div>}
                <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">{s.desc}</div>
                {s.price && <div className="mt-3 text-xs font-bold" style={{ color: d.accentHex }}>{s.price} →</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 4: Alternating rows — text + visual (interior, B2B) ───────────────
export function ServicesAlternating({ d }: { d: ServicesData }) {
  return (
    <section className="bg-white px-8 py-14">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>{d.sectionLabel ?? "What We Offer"}</div>
          <h2 className="text-2xl font-extrabold text-gray-900">Our Services</h2>
        </div>
        <div className="space-y-8">
          {d.services.slice(0, 4).map((s, i) => (
            <div key={s.name} className={`flex gap-8 items-center ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
              {s.image ? (
                <div className="relative w-48 h-36 flex-shrink-0 rounded-2xl overflow-hidden shadow-md">
                  <Image src={s.image} alt={s.name} fill sizes="192px" className="object-cover" />
                </div>
              ) : (
                <div
                  className="w-48 h-36 flex-shrink-0 rounded-2xl flex items-center justify-center text-5xl"
                  style={{ background: `linear-gradient(135deg, ${d.primaryColor}22, ${d.accentHex}33)` }}
                >
                  {s.icon}
                </div>
              )}
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>0{i + 1}</div>
                <div className="font-extrabold text-lg text-gray-900 mb-2">{s.name}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{s.desc}</div>
                {s.price && (
                  <div className="mt-3 inline-block text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${d.accentHex}15`, color: d.accentHex }}>
                    {s.price}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 5: Number cards — corporate/trading ───────────────────────────────
export function ServicesNumbered({ d }: { d: ServicesData }) {
  return (
    <section className="px-8 py-14" style={{ backgroundColor: d.primaryColor }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2 text-white/60">{d.sectionLabel ?? "What We Offer"}</div>
          <h2 className="text-2xl font-extrabold text-white">Our Services</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {d.services.slice(0, 6).map((s, i) => (
            <div key={s.name} className="rounded-xl overflow-hidden group cursor-pointer bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/20 transition-all">
              {s.image ? (
                <div className="relative h-28 w-full">
                  <Image src={s.image} alt={s.name} fill sizes="200px" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                  <div className="absolute top-2 left-3 text-2xl font-black text-white/30">0{i + 1}</div>
                </div>
              ) : (
                <div className="p-5 pb-0">
                  <div className="text-3xl font-black text-white/20 mb-3">0{i + 1}</div>
                  <div className="text-2xl mb-2">{s.icon}</div>
                </div>
              )}
              <div className="p-4 pt-3">
                <div className="font-bold text-sm text-white mb-1">{s.name}</div>
                <div className="text-xs text-white/60 leading-relaxed line-clamp-2">{s.desc}</div>
                {s.price && <div className="mt-2 text-xs font-bold text-white/80">{s.price}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
