"use client";

interface Stat { value: string; label: string }
interface StatsData { stats: Stat[]; primaryColor: string; accentHex: string; secondaryColor: string }

// ── Variant 1: Horizontal bar on white (default) ──────────────────────────────
export function StatsBar({ d }: { d: StatsData }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="grid grid-cols-4 divide-x divide-gray-100">
        {d.stats.map(s => (
          <div key={s.label} className="px-6 py-5 text-center">
            <div className="font-extrabold text-2xl" style={{ color: d.accentHex }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Variant 2: Dark colored band ─────────────────────────────────────────────
export function StatsDarkBand({ d }: { d: StatsData }) {
  return (
    <div style={{ backgroundColor: d.primaryColor }}>
      <div className="grid grid-cols-4">
        {d.stats.map(s => (
          <div key={s.label} className="px-6 py-6 text-center border-r border-white/10 last:border-0">
            <div className="font-black text-3xl text-white">{s.value}</div>
            <div className="text-white/60 text-xs mt-1 font-medium uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Variant 3: Cards with accent color tops ───────────────────────────────────
export function StatsCards({ d }: { d: StatsData }) {
  return (
    <div className="bg-gray-50 px-8 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {d.stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="h-1.5" style={{ backgroundColor: d.accentHex }} />
            <div className="p-4 text-center">
              <div className="font-extrabold text-2xl text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Variant 4: Inline with dividers — editorial style ────────────────────────
export function StatsEditorial({ d }: { d: StatsData }) {
  return (
    <div className="bg-white px-10 py-8 border-y border-gray-200">
      <div className="flex items-center justify-center gap-0 flex-wrap">
        {d.stats.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className="px-8 py-2 text-center">
              <span className="font-bold text-3xl text-gray-900" style={{ fontFamily: "Georgia, serif" }}>{s.value}</span>
              <span className="text-xs text-gray-400 ml-2">{s.label}</span>
            </div>
            {i < d.stats.length - 1 && <div className="w-px h-8 bg-gray-200" />}
          </div>
        ))}
      </div>
    </div>
  );
}
