import { MousePointerClick, Paintbrush, Rocket, Clock, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    step: "01",
    title: "Pick your plan & template",
    desc: "Choose Standard or Premium and pick from 50+ industry-specific templates built for your exact business type.",
    detail: "Takes under 2 minutes",
    color: "from-orange-500 to-rose-500",
  },
  {
    icon: Paintbrush,
    step: "02",
    title: "Customize your site",
    desc: "Add your logo, colors, services, and pricing using the drag-and-drop builder. No code needed. Every section is editable — hero, testimonials, contact forms, gallery, and more.",
    detail: "Most businesses finish in 1–2 hours",
    color: "from-rose-500 to-amber-500",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Go live & start getting customers",
    desc: "Connect your domain (or get one free from us). We handle SSL, CDN, and hosting. Your site goes live instantly — and starts appearing in Google search results within days.",
    detail: "Live within 24 hours",
    color: "from-amber-500 to-orange-500",
  },
];

const TIMELINE = [
  { time: "0:00", event: "Sign up & choose template" },
  { time: "0:30", event: "Add your logo, colors & branding" },
  { time: "1:00", event: "Add your services & pricing" },
  { time: "1:30", event: "Upload photos & add testimonials" },
  { time: "2:00", event: "Connect domain or register new one" },
  { time: "24h", event: "Site live — customers find you" },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-orange-300 text-xs font-semibold px-4 py-2 rounded-full mb-4 border border-white/[0.08]">
            <Clock className="w-3.5 h-3.5" /> From zero to live in under 24 hours
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Up and running faster than you think</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
            We built this for business owners, not developers. Three steps and your business is online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-[33%] right-[33%] h-px bg-gradient-to-r from-orange-500/40 via-rose-500/40 to-amber-500/40" />

          {STEPS.map(({ icon: Icon, step, title, desc, detail, color }) => (
            <div key={step} className="relative bg-white/[0.02] rounded-2xl border border-white/[0.06] p-7 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all group">
              <div className="relative inline-flex mb-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/40`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-2 -right-3 bg-[#0a0b12] border-2 border-white/10 text-slate-400 text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-3 leading-tight">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
              <div className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs font-medium px-3 py-1.5 rounded-full">
                <Clock className="w-3 h-3" /> {detail}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="mt-16 bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8">
          <h3 className="font-semibold text-white text-center mb-8">What your first day actually looks like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TIMELINE.map(({ time, event }, i) => (
              <div key={i} className="text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-xs font-black ${i === 5 ? "bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-lg shadow-emerald-950/40" : "bg-white/[0.05] text-slate-400"}`}>
                  {time}
                </div>
                <p className={`text-xs leading-snug ${i === 5 ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>{event}</p>
                {i < 5 && (
                  <div className="hidden lg:flex justify-center mt-3">
                    <ArrowRight className="w-3 h-3 text-slate-700 -mr-[calc(100%+1rem)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
