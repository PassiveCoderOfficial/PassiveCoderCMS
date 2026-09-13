import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Globe2 } from "lucide-react";

interface Settings {
  hero_headline?: string;
  hero_subheadline?: string;
  hero_cta_text?: string;
  hero_cta_url?: string;
  hero_secondary_cta?: string;
  stat_sites?: string;
  stat_businesses?: string;
  stat_uptime?: string;
}

const REGIONS = ["UAE", "Saudi Arabia", "Qatar", "Oman", "Malaysia", "Singapore", "Bangladesh"];

export default function HeroSection({ settings }: { settings: Settings | null }) {
  const s = settings ?? {};
  return (
    <section className="relative overflow-hidden bg-[#05060a] pt-16 pb-0 sm:pt-24">
      {/* Gradient mesh background — the visual signal for "modern platform"
          rather than "agency site": layered radial glows instead of a flat
          brand-color wash. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 bg-white/[0.06] text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full border border-white/[0.08] backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI-assisted build pipeline · {s.stat_sites ?? "17+"} sites shipped across {s.stat_businesses ?? "8"} countries
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl lg:text-[4.25rem] font-bold text-white leading-[1.08] tracking-tight max-w-4xl mx-auto">
          {s.hero_headline ? (
            <span>{s.hero_headline}</span>
          ) : (
            <>
              The Platform Behind Websites{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                That Actually Convert
              </span>
            </>
          )}
        </h1>

        <p className="text-center mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {s.hero_subheadline ?? "Passive Coder is the infrastructure local service businesses run on — AI-drafted content, a real page builder, built-in commerce and CRM, and a team that ships in hours, not weeks."}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link
            href={s.hero_cta_url ?? "/onboarding"}
            className="group inline-flex items-center gap-2 bg-white text-slate-950 font-semibold px-8 py-4 rounded-xl shadow-2xl shadow-indigo-950/50 transition-all hover:scale-[1.02] hover:shadow-indigo-500/20 text-base"
          >
            {s.hero_cta_text ?? "Get Started"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.1] text-slate-300 font-medium px-8 py-4 rounded-xl hover:border-white/20 hover:bg-white/[0.07] hover:text-white transition-all text-base"
          >
            {s.hero_secondary_cta ?? "See Pricing"}
          </Link>
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-7 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Card, bKash &amp; Nagad accepted</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-emerald-500" /> Live in hours, not weeks</span>
          <span className="flex items-center gap-1.5"><Globe2 className="w-4 h-4 text-emerald-500" /> A real team on support</span>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto">
          {[
            { value: s.stat_sites ?? "17+", label: "Sites shipped" },
            { value: s.stat_businesses ?? "8", label: "Countries served" },
            { value: s.stat_uptime ?? "99.9%", label: "Platform uptime" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center py-5 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Regions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-10 pb-14">
          <span className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold mr-1">Live in</span>
          {REGIONS.map((label) => (
            <span key={label} className="bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-full text-xs text-slate-400">
              {label}
            </span>
          ))}
        </div>

        {/* Product mockup — a live dashboard glimpse instead of a template
            preview, matching the platform (not agency-brochure) framing. */}
        <div className="relative mt-4 -mx-4 sm:mx-0">
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#05060a] to-transparent z-10 pointer-events-none" />
          <div className="max-w-4xl mx-auto">
            <div className="rounded-t-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60 bg-[#0a0b12]">
              <div className="bg-white/[0.03] px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 bg-white/[0.04] rounded-md px-3 py-1 text-xs text-slate-500 text-center border border-white/[0.05] font-mono">
                  dashboard.passivecoder.com
                </div>
              </div>
              <div className="grid sm:grid-cols-[220px_1fr]">
                <div className="hidden sm:block bg-white/[0.02] border-r border-white/[0.06] p-4 space-y-1">
                  {["Overview", "Pages", "Products", "Orders", "CRM", "Analytics", "Settings"].map((item, i) => (
                    <div
                      key={item}
                      className={`text-xs px-3 py-2 rounded-lg ${i === 0 ? "bg-indigo-500/10 text-indigo-300 font-medium" : "text-slate-500"}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Visitors", value: "4,218", delta: "+12%" },
                      { label: "Orders", value: "86", delta: "+8%" },
                      { label: "Revenue", value: "$3,140", delta: "+21%" },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">{m.label}</div>
                        <div className="text-lg font-bold text-white mt-1">{m.value}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">{m.delta} this week</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 h-28 flex items-end gap-1.5">
                    {[40, 65, 45, 80, 60, 90, 70, 95, 75, 100, 85, 92].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500/40 to-violet-400/60 rounded-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
