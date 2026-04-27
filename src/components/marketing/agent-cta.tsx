import Link from "next/link";
import { ArrowRight, DollarSign, Globe, Zap, Users } from "lucide-react";

const PERKS = [
  { icon: DollarSign, title: "20% Commission", desc: "Earn on every site you refer to the platform." },
  { icon: Globe, title: "Manage Client Sites", desc: "Log into any site you referred from your dashboard." },
  { icon: Zap, title: "Instant Approval", desc: "Auto-approved. No gatekeeping, no waiting." },
  { icon: Users, title: "Referral Tracking", desc: "Unique link — every signup credited to you." },
];

export default function AgentCtaSection() {
  return (
    <section id="agents" className="py-24 bg-gray-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold px-4 py-2 rounded-full border border-indigo-500/20 mb-6">
              <Zap className="w-3 h-3" /> Free to Join
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Are you a web developer or digital agency?
            </h2>
            <p className="mt-4 text-gray-400 text-lg leading-relaxed">
              Become a Passive Coder Agent. Refer clients, earn 20% commission on every subscription, and manage all your client sites from one dashboard.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {PERKS.map(perk => (
                <div key={perk.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <perk.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{perk.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link
                href="/become-agent"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-900/50 text-base"
              >
                Become an Agent — Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/agents"
                className="inline-flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
              >
                Learn More
              </Link>
            </div>
            <p className="text-gray-600 text-xs mt-4">No fee. No approval wait. Instant dashboard access.</p>
          </div>

          {/* Right: visual card */}
          <div className="lg:flex justify-end hidden">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Agent Dashboard</p>
                  <p className="text-xs text-gray-500">Your referral portal</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sites Referred", value: "12" },
                  { label: "Total Earned", value: "$480" },
                  { label: "Pending Payout", value: "$120" },
                  { label: "Commission Rate", value: "20%" },
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-white mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800 rounded-xl p-3 space-y-1">
                <p className="text-xs text-gray-500">Your Referral Link</p>
                <p className="font-mono text-xs text-indigo-400 truncate">passivecoder.com/onboarding?ref=<span className="text-orange-400">abc12345</span></p>
              </div>

              <div className="space-y-2">
                {["Premier Clean Co. · active", "Luxe Salon · trial", "Metro HVAC · active"].map(site => (
                  <div key={site} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-300">{site.split(" · ")[0]}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${site.includes("active") ? "bg-green-900/40 text-green-400" : "bg-amber-900/40 text-amber-400"}`}>
                      {site.split(" · ")[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
