"use client";

import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";

export interface HeroData {
  headline: string;
  subline: string;
  badge?: string;
  cta: string;
  ctaSecondary: string;
  badges: string[];
  primaryColor: string;
  secondaryColor: string;
  accentHex: string;
  heroImage?: string;
  tagline: string;
}

// ── Variant 1: Full-cover BG image, center-aligned text ──────────────────────
// Used by: BuildRight (renovation), ShieldGuard (security)
export function HeroBoldDark({ d }: { d: HeroData }) {
  return (
    <section className="relative min-h-[560px] flex flex-col items-center justify-center text-center px-8 py-20 overflow-hidden">
      {/* Background image */}
      {d.heroImage && (
        <Image
          src={d.heroImage}
          alt={d.headline}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      )}
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${d.primaryColor}e0 0%, ${d.secondaryColor}cc 100%)` }}
      />
      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />
      {/* Content */}
      <div className="relative z-10">
        {d.badge && (
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            {d.badge}
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5 max-w-3xl mx-auto">
          {d.headline}
        </h1>
        <p className="text-white/75 text-base leading-relaxed mb-8 max-w-xl mx-auto">
          {d.subline}
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {d.badges.slice(0, 4).map(b => (
            <span key={b} className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Check className="w-3 h-3" /> {b}
            </span>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button className="bg-white text-sm font-bold px-8 py-3.5 rounded-xl shadow-xl cursor-pointer" style={{ color: d.primaryColor }}>
            {d.cta}
          </button>
          <button className="border-2 border-white/40 text-white text-sm font-semibold px-8 py-3.5 rounded-xl cursor-pointer backdrop-blur-sm hover:bg-white/10">
            {d.ctaSecondary}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Variant 2: Left text, right full-height image panel ──────────────────────
// Used by: CoolBreeze (HVAC), ColourCraft (painting), ShineAuto (car wash)
export function HeroSplitImage({ d }: { d: HeroData }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
      {/* Left: text panel */}
      <div
        className="flex flex-col justify-center px-10 py-16"
        style={{ background: `linear-gradient(135deg, ${d.primaryColor}, ${d.secondaryColor})` }}
      >
        {d.badge && (
          <div className="inline-flex w-fit items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-white/20">
            {d.badge}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
          {d.headline}
        </h1>
        <p className="text-white/75 text-sm leading-relaxed mb-6 max-w-sm">
          {d.subline}
        </p>
        <div className="flex gap-3 flex-wrap mb-6">
          <button className="bg-white text-sm font-bold px-6 py-3 rounded-lg cursor-pointer shadow-lg" style={{ color: d.primaryColor }}>
            {d.cta}
          </button>
          <button className="border-2 border-white/40 text-white text-sm font-semibold px-6 py-3 rounded-lg cursor-pointer">
            {d.ctaSecondary}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {d.badges.slice(0, 3).map(b => (
            <span key={b} className="flex items-center gap-1 bg-white/10 text-white text-[11px] px-2.5 py-1 rounded-full border border-white/20">
              <Check className="w-2.5 h-2.5" /> {b}
            </span>
          ))}
        </div>
      </div>

      {/* Right: full-bleed image */}
      <div className="relative overflow-hidden min-h-[300px]">
        {d.heroImage ? (
          <Image
            src={d.heroImage}
            alt={d.headline}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${d.secondaryColor}, ${d.primaryColor}88)` }} />
        )}
        <div className="absolute inset-0 bg-black/20" />
        {/* Floating card */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <div className="text-white font-bold text-sm">{d.tagline}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Variant 3: Light BG, text left, image right ────────────────────────────
// Used by: GlassLine (glass), FreshWash (laundry), MedPlus (clinic)
export function HeroMinimalLight({ d }: { d: HeroData }) {
  return (
    <section className="bg-white border-b border-gray-100 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
        {/* Left: text */}
        <div className="flex flex-col justify-center px-10 py-16">
          {d.badge && (
            <div
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6 border"
              style={{ color: d.primaryColor, borderColor: `${d.primaryColor}40`, backgroundColor: `${d.primaryColor}08` }}
            >
              {d.badge}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5 tracking-tight">
            {d.headline}
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
            {d.subline}
          </p>
          <div className="flex gap-3 flex-wrap mb-8">
            <button
              className="text-white text-sm font-bold px-8 py-3.5 rounded-xl cursor-pointer shadow-lg"
              style={{ backgroundColor: d.primaryColor }}
            >
              {d.cta}
            </button>
            <button className="border border-gray-200 text-gray-700 text-sm font-semibold px-8 py-3.5 rounded-xl cursor-pointer hover:border-gray-400">
              {d.ctaSecondary}
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {d.badges.slice(0, 4).map(b => (
              <span key={b} className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Check className="w-3.5 h-3.5" style={{ color: d.primaryColor }} /> {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right: image */}
        <div className="relative overflow-hidden min-h-[300px] md:min-h-0">
          {d.heroImage ? (
            <Image
              src={d.heroImage}
              alt={d.headline}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${d.primaryColor}20, ${d.primaryColor}08)` }} />
          )}
          {/* Accent strip */}
          <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: d.primaryColor }} />
        </div>
      </div>
    </section>
  );
}

// ── Variant 4: Angled/diagonal split with image fill ─────────────────────────
// Used by: SparkyPro (electrical), PestShield (pest), DriveAcademy (driving)
export function HeroAngledSplit({ d }: { d: HeroData }) {
  return (
    <section className="relative overflow-hidden min-h-[520px] grid grid-cols-1 md:grid-cols-2">
      {/* Left: text content */}
      <div
        className="relative z-10 flex flex-col justify-center px-10 py-20"
        style={{ background: d.primaryColor }}
      >
        {d.badge && (
          <div className="inline-flex w-fit items-center gap-2 bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider border border-white/20">
            {d.badge}
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
          {d.headline}
        </h1>
        <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-md">
          {d.subline}
        </p>
        <div className="flex gap-3 flex-wrap mb-8">
          <button className="bg-white text-sm font-bold px-7 py-3.5 rounded-lg cursor-pointer shadow-lg" style={{ color: d.primaryColor }}>
            {d.cta}
          </button>
          <button className="border-2 border-white/30 text-white text-sm font-semibold px-7 py-3.5 rounded-lg cursor-pointer">
            {d.ctaSecondary}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {d.badges.slice(0, 4).map(b => (
            <span key={b} className="flex items-center gap-1.5 bg-white/10 text-white text-[11px] font-medium px-3 py-1.5 rounded-full border border-white/20">
              <Check className="w-2.5 h-2.5" /> {b}
            </span>
          ))}
        </div>
        {/* Angled clip on right edge */}
        <div
          className="absolute top-0 right-0 bottom-0 w-16"
          style={{
            background: "#fff",
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
          }}
        />
      </div>

      {/* Right: full-bleed image */}
      <div className="relative overflow-hidden min-h-[280px] md:min-h-0">
        {d.heroImage ? (
          <Image
            src={d.heroImage}
            alt={d.headline}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${d.secondaryColor}, ${d.primaryColor}88)` }} />
        )}
        <div className="absolute inset-0 bg-black/30" />
        {/* Badge overlay */}
        <div className="absolute top-8 right-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-sm shadow-2xl border-4 border-white/30"
            style={{ background: d.accentHex }}
          >
            {d.badges[0]?.split(" ")[0] ?? "✓"}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Variant 5: Editorial — full BG image, text overlay bottom-left ────────────
// Used by: CurtainStudio, FeastEvents (catering)
export function HeroEditorial({ d }: { d: HeroData }) {
  return (
    <section className="relative overflow-hidden min-h-[580px] flex items-end">
      {/* Full background image */}
      {d.heroImage ? (
        <Image
          src={d.heroImage}
          alt={d.headline}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${d.primaryColor}, ${d.secondaryColor})` }} />
      )}
      {/* Gradient overlay from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {/* Editorial text, bottom-anchored */}
      <div className="relative z-10 px-10 pb-12 pt-40 w-full max-w-3xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: d.accentHex }}>
          {d.tagline}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "Georgia, serif" }}>
          {d.headline}
        </h1>
        <p className="text-white/70 text-base leading-relaxed mb-8 max-w-lg">
          {d.subline}
        </p>
        <div className="flex gap-3 flex-wrap mb-6">
          <button
            className="text-sm font-semibold px-8 py-3.5 cursor-pointer border-2 border-white text-white hover:bg-white transition-colors"
            style={{ backgroundColor: "transparent" }}
          >
            {d.cta}
          </button>
          <button className="border border-white/30 text-white/80 text-sm font-semibold px-8 py-3.5 cursor-pointer flex items-center gap-2 hover:border-white/60 transition-colors">
            {d.ctaSecondary} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {d.badges.slice(0, 4).map(b => (
            <span key={b} className="text-white/70 text-xs border-l-2 pl-2" style={{ borderColor: d.accentHex }}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Variant 6: Corporate — full BG image with dark overlay, centered ──────────
// Used by: TradeSupply (B2B), UniformPro (corporate)
export function HeroCorporate({ d }: { d: HeroData }) {
  return (
    <section className="relative overflow-hidden min-h-[520px] flex items-center justify-center">
      {/* Background image */}
      {d.heroImage ? (
        <Image
          src={d.heroImage}
          alt={d.headline}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      ) : null}
      {/* Dark color overlay */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${d.primaryColor}f0 0%, ${d.secondaryColor}d0 60%, ${d.primaryColor}cc 100%)` }}
      />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-10 py-24 text-center">
        {d.badge && (
          <div className="inline-flex items-center gap-2 border border-white/30 text-white/90 text-xs font-medium px-4 py-2 rounded-sm mb-8 uppercase tracking-widest">
            {d.badge}
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5 tracking-tight">
          {d.headline}
        </h1>
        <p className="text-white/65 text-base leading-relaxed mb-10 max-w-2xl mx-auto">
          {d.subline}
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-12">
          <button
            className="text-sm font-bold px-8 py-3.5 rounded-sm cursor-pointer shadow-xl"
            style={{ backgroundColor: d.accentHex, color: "#000" }}
          >
            {d.cta}
          </button>
          <button className="border border-white/40 text-white text-sm font-semibold px-8 py-3.5 rounded-sm cursor-pointer hover:bg-white/10">
            {d.ctaSecondary}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
          {d.badges.slice(0, 4).map(b => (
            <div key={b} className="flex items-center gap-2 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <Check className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
              <span className="text-white/80 text-xs font-medium">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
