import Link from "next/link";
import { ArrowRight, DollarSign, Globe, Zap, Users, TrendingUp, CheckCircle, Star } from "lucide-react";

const PERKS = [
  {
    icon: DollarSign,
    title: "20% Recurring Commission",
    desc: "Earn 20% of every subscription you refer — month after month, year after year. Passive income that grows with your client base.",
  },
  {
    icon: Globe,
    title: "Manage All Client Sites",
    desc: "Log into any site you referred from your own dashboard. Update content, check analytics, or fix issues without needing client access.",
  },
  {
    icon: Zap,
    title: "Instant Approval — No Waiting",
    desc: "Sign up and get approved automatically. No application review, no gatekeeping. Your dashboard is ready in minutes.",
  },
  {
    icon: Users,
    title: "Unique Referral Tracking",
    desc: "Every signup through your link is tracked and credited to you — forever. Even if they sign up weeks after clicking.",
  },
  {
    icon: TrendingUp,
    title: "Grows With You",
    desc: "Refer 5 sites and earn $1,000/year passively. Refer 20 sites and earn $4,000+/year. No cap on how much you can earn.",
  },
  {
    icon: Star,
    title: "Priority Support for Agents",
    desc: "Your client issues jump the queue. We treat your clients like our own so you always look good in front of them.",
  },
];

const EARNINGS = [
  { sites: "3 sites", monthly: "$60/mo", annual: "$720/yr" },
  { sites: "10 sites", monthly: "$200/mo", annual: "$2,400/yr" },
  { sites: "25 sites", monthly: "$500/mo", annual: "$6,000/yr" },
  { sites: "50 sites", monthly: "$1,000/mo", annual: "$12,000/yr" },
];

export default function AgentCtaSection() {
  return (
    <section id="agents" className="py-24 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold px-4 py-2 rounded-full border border-indigo-500/20 mb-5">
            <Zap className="w-3 h-3" /> Free to Join · Instant Approval · No Experience Needed
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
            Are you a web developer, designer,<br className="hidden sm:block" /> or digital agency?
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Become a Passive Coder Agent. Refer clients, earn 20% recurring commission on every subscription, and manage all your client sites from a single dashboard.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: perks */}
          <div className="space-y-5">
            {PERKS.map(perk => (
              <div key={perk.title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <perk.icon className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{perk.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/become-agent"
                className="group inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-xl shadow-indigo-900/50 text-base"
              >
                Become an Agent — Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/agents"
                className="inline-flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
              >
                Learn More
              </Link>
            </div>
            <p className="text-gray-600 text-xs flex items-center gap-1.5 pt-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" /> No fee. No approval wait. Instant dashboard access.
            </p>
          </div>

          {/* Right: earnings calculator + dashboard preview */}
          <div className="space-y-5">
            {/* Earnings table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Potential earnings (20% commission on $199/yr Standard plan)
              </p>
              <div className="space-y-2">
                {EARNINGS.map(row => (
                  <div key={row.sites} className="flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3">
                    <span className="text-gray-300 text-sm font-medium">{row.sites} referred</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 text-xs">{row.monthly}</span>
                      <span className="text-indigo-400 font-bold text-sm">{row.annual}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-3">Based on Standard plan. Premium plan pays even more.</p>
            </div>

            {/* Dashboard preview card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Agent Dashboard</p>
                  <p className="text-xs text-gray-500">Your referral & client portal</p>
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
                <p className="font-mono text-xs text-indigo-400 truncate">
                  passivecoder.com/onboarding?ref=<span className="text-orange-400">abc12345</span>
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { name: "Premier Clean Co.", status: "active", earned: "$40" },
                  { name: "Luxe Salon", status: "trial", earned: "—" },
                  { name: "Metro HVAC", status: "active", earned: "$40" },
                ].map(site => (
                  <div key={site.name} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs text-gray-300 font-medium">{site.name}</p>
                      <p className="text-[10px] text-gray-600">Commission: {site.earned}/yr</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${site.status === "active" ? "bg-green-900/40 text-green-400" : "bg-amber-900/40 text-amber-400"}`}>
                      {site.status}
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
