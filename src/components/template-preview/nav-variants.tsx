"use client";

interface NavData {
  siteName: string;
  navLinks: { label: string; href: string }[];
  cta: string;
  primaryColor: string;
  accentHex: string;
}

// ── Variant 1: Dark solid with CTA button ─────────────────────────────────────
export function NavDarkSolid({ d }: { d: NavData }) {
  return (
    <nav className="px-8 py-4 flex items-center justify-between" style={{ backgroundColor: d.primaryColor }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>
          {d.siteName.charAt(0)}
        </div>
        <span className="font-bold text-white text-sm">{d.siteName}</span>
      </div>
      <div className="hidden md:flex items-center gap-6">
        {d.navLinks.slice(0, 4).map(l => (
          <span key={l.label} className="text-xs text-white/75 font-medium cursor-pointer hover:text-white transition-colors">{l.label}</span>
        ))}
      </div>
      <button className="bg-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer" style={{ color: d.primaryColor }}>
        {d.cta}
      </button>
    </nav>
  );
}

// ── Variant 2: White with colored accent underline + border ───────────────────
export function NavWhiteBorder({ d }: { d: NavData }) {
  return (
    <nav className="px-8 py-4 flex items-center justify-between bg-white border-b-2" style={{ borderBottomColor: d.primaryColor }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white" style={{ backgroundColor: d.primaryColor }}>
          {d.siteName.charAt(0)}
        </div>
        <span className="font-bold text-gray-900 text-sm">{d.siteName}</span>
      </div>
      <div className="hidden md:flex items-center gap-6">
        {d.navLinks.slice(0, 4).map(l => (
          <span key={l.label} className="text-xs text-gray-600 font-medium cursor-pointer hover:text-gray-900">{l.label}</span>
        ))}
      </div>
      <button className="text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: d.primaryColor }}>
        {d.cta}
      </button>
    </nav>
  );
}

// ── Variant 3: Transparent / glass (editorial / luxury) ───────────────────────
export function NavTransparent({ d }: { d: NavData }) {
  return (
    <nav className="px-8 py-5 flex items-center justify-between absolute top-0 left-0 right-0 z-20">
      <div className="flex items-center gap-3">
        <span className="font-bold text-white text-base tracking-tight" style={{ fontFamily: "Georgia, serif" }}>{d.siteName}</span>
      </div>
      <div className="hidden md:flex items-center gap-7">
        {d.navLinks.slice(0, 4).map(l => (
          <span key={l.label} className="text-xs text-white/80 font-medium cursor-pointer hover:text-white tracking-wide uppercase">{l.label}</span>
        ))}
      </div>
      <button className="border border-white/60 text-white text-xs font-semibold px-5 py-2 rounded-none cursor-pointer hover:bg-white/10 uppercase tracking-wider">
        {d.cta}
      </button>
    </nav>
  );
}

// ── Variant 4: Corporate minimal — logo left, links centered, phone right ─────
export function NavCorporate({ d }: { d: NavData }) {
  return (
    <nav className="px-8 py-0 bg-white border-b border-gray-200">
      <div className="flex items-stretch justify-between">
        <div className="flex items-center gap-3 py-3 border-r border-gray-200 pr-8">
          <div className="w-8 h-8 rounded flex items-center justify-center font-black text-sm text-white" style={{ backgroundColor: d.primaryColor }}>
            {d.siteName.charAt(0)}
          </div>
          <span className="font-bold text-gray-900 text-sm">{d.siteName}</span>
        </div>
        <div className="hidden md:flex items-stretch gap-0">
          {d.navLinks.slice(0, 4).map(l => (
            <span key={l.label} className="flex items-center px-5 text-xs text-gray-600 font-medium cursor-pointer hover:bg-gray-50 border-r border-gray-100 hover:text-gray-900">
              {l.label}
            </span>
          ))}
        </div>
        <button className="my-2 text-white text-xs font-bold px-5 py-2 rounded cursor-pointer" style={{ backgroundColor: d.primaryColor }}>
          {d.cta}
        </button>
      </div>
    </nav>
  );
}
