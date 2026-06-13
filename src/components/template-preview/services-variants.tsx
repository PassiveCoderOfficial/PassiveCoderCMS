"use client";

interface Service { name: string; desc: string; price?: string; icon: string }
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
          <div key={s.name} className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group">
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="font-bold text-sm text-gray-900 mb-1.5 group-hover:text-gray-700">{s.name}</div>
            <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">{s.desc}</div>
            {s.price && <div className="mt-3 text-xs font-bold" style={{ color: d.accentHex }}>{s.price}</div>}
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
            <div key={s.name} className={`flex items-start gap-5 p-5 hover:bg-gray-50 cursor-pointer transition-colors ${i < d.services.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `${d.accentHex}15` }}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 mb-0.5">{s.name}</div>
                <div className="text-xs text-gray-500 leading-relaxed line-clamp-1">{s.desc}</div>
              </div>
              {s.price && (
                <div className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${d.accentHex}15`, color: d.accentHex }}>
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
  const colors = [d.primaryColor, d.accentHex, d.secondaryColor, `${d.primaryColor}cc`, `${d.accentHex}cc`, d.secondaryColor];
  return (
    <section className="px-8 py-14" style={{ backgroundColor: `${d.primaryColor}08` }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>{d.sectionLabel ?? "What We Offer"}</div>
          <h2 className="text-2xl font-extrabold text-gray-900">Our Services</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {d.services.slice(0, 4).map((s, i) => (
            <div key={s.name} className="rounded-2xl overflow-hidden shadow-md group cursor-pointer">
              <div className="h-36 flex items-center justify-center text-5xl" style={{ backgroundColor: colors[i % colors.length] + "33", borderBottom: `4px solid ${colors[i % colors.length]}` }}>
                {s.icon}
              </div>
              <div className="bg-white p-5">
                <div className="font-bold text-sm text-gray-900 mb-1">{s.name}</div>
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
              <div
                className="w-48 h-32 flex-shrink-0 rounded-2xl flex items-center justify-center text-5xl"
                style={{ background: `linear-gradient(135deg, ${d.primaryColor}22, ${d.accentHex}33)` }}
              >
                {s.icon}
              </div>
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
            <div key={s.name} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-5 hover:bg-white/15 transition-all cursor-pointer">
              <div className="text-3xl font-black text-white/20 mb-3">0{i + 1}</div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-bold text-sm text-white mb-1">{s.name}</div>
              <div className="text-xs text-white/60 leading-relaxed line-clamp-2">{s.desc}</div>
              {s.price && <div className="mt-3 text-xs font-bold text-white/80">{s.price}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
