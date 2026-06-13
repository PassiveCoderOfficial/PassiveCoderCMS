"use client";

import { Check } from "lucide-react";

interface AboutData {
  heading: string;
  body: string;
  highlights: string[];
  primaryColor: string;
  accentHex: string;
  secondaryColor: string;
  stat?: { value: string; label: string };
  icon?: string;
}

// ── Variant 1: Text left / visual right (standard) ────────────────────────────
export function AboutSplit({ d }: { d: AboutData }) {
  return (
    <section className="bg-white px-8 py-14 border-y border-gray-100">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: d.accentHex }}>About Us</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4 leading-tight">{d.heading}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{d.body}</p>
          <ul className="space-y-2">
            {d.highlights.map(h => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${d.accentHex}20` }}>
                  <Check className="w-3 h-3" style={{ color: d.accentHex }} />
                </div>
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl h-56 flex flex-col items-center justify-center gap-4 p-8" style={{ background: `linear-gradient(135deg, ${d.primaryColor}30, ${d.accentHex}40)` }}>
          <div className="text-6xl">{d.icon ?? "⭐"}</div>
          {d.stat && (
            <div className="text-center">
              <div className="font-extrabold text-2xl text-gray-900">{d.stat.value}</div>
              <div className="text-sm text-gray-500">{d.stat.label}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Variant 2: Full-width with color background + side checklist ──────────────
export function AboutColorBlock({ d }: { d: AboutData }) {
  return (
    <section style={{ backgroundColor: `${d.primaryColor}08` }} className="px-8 py-14">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-3">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: d.accentHex }}>Who We Are</div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4 leading-tight">{d.heading}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{d.body}</p>
          </div>
          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="space-y-3">
              {d.highlights.map(h => (
                <div key={h} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                  <div className="w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0" style={{ backgroundColor: d.accentHex }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium leading-snug">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Variant 3: Dark section — white text (trading, corporate) ─────────────────
export function AboutDark({ d }: { d: AboutData }) {
  return (
    <section style={{ background: `linear-gradient(135deg, ${d.primaryColor}, ${d.secondaryColor})` }} className="px-8 py-16">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3 text-white/50">About Us</div>
          <h2 className="text-2xl font-extrabold text-white mb-4 leading-tight">{d.heading}</h2>
          <p className="text-sm text-white/65 leading-relaxed">{d.body}</p>
        </div>
        <div className="space-y-2.5">
          {d.highlights.map(h => (
            <div key={h} className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-lg px-4 py-2.5">
              <Check className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
              <span className="text-white/80 text-sm font-medium">{h}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 4: Editorial — large serif heading, minimal layout ────────────────
export function AboutEditorial({ d }: { d: AboutData }) {
  return (
    <section className="bg-white px-8 py-16 border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: d.accentHex }}>Our Story</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-5 leading-tight" style={{ fontFamily: "Georgia, serif" }}>{d.heading}</h2>
            <p className="text-gray-500 leading-relaxed text-sm">{d.body}</p>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-4 text-gray-400">Why Choose Us</div>
            <ul className="space-y-3">
              {d.highlights.map(h => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="font-bold mt-0.5" style={{ color: d.accentHex }}>—</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
