import Link from "next/link";
import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";
import { ArrowRight, DollarSign, Globe, Zap, Users, BarChart3, Shield, Clock } from "lucide-react";

export const metadata = {
  title: "Become an Agent — Passive Coder",
  description: "Join the Passive Coder Agent program. Refer clients, earn 20% commission, manage all client sites from one dashboard. Free to join, instant approval.",
};

const PERKS = [
  {
    icon: DollarSign,
    title: "20% Commission",
    desc: "Earn 20% of every subscription from clients you refer — recurring, not one-time.",
    color: "text-green-400 bg-green-500/10",
  },
  {
    icon: Globe,
    title: "Client Site Access",
    desc: "Log into and manage any site you referred directly from your Agent dashboard.",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "Instant Approval",
    desc: "Auto-approved the moment you sign up. No gatekeeping, no waiting, no fees.",
    color: "text-yellow-400 bg-yellow-500/10",
  },
  {
    icon: Users,
    title: "Unique Referral Link",
    desc: "Every signup through your link is tracked and credited to you automatically.",
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: "Earnings Dashboard",
    desc: "Track all referred sites, commission status, and payout history in one place.",
    color: "text-orange-400 bg-orange-500/10",
  },
  {
    icon: Shield,
    title: "Dedicated Support",
    desc: "Direct access to our team for onboarding help, client questions, and anything you need.",
    color: "text-indigo-400 bg-indigo-500/10",
  },
];

const STEPS = [
  { step: "01", title: "Sign Up Free", desc: "Fill in your name, email, and a bit about yourself. No approval needed — instant access." },
  { step: "02", title: "Get Your Link", desc: "Receive a unique referral link and code. Share it with potential clients or your audience." },
  { step: "03", title: "Client Onboards", desc: "Client signs up via your link. Site is created. You're credited automatically." },
  { step: "04", title: "Earn Commission", desc: "When they subscribe to a paid plan, you earn 20%. Tracked in your dashboard." },
];

const FAQS = [
  { q: "Is it really free to join?", a: "Yes. No fees, no approval wait, no gatekeeping. Sign up and your Agent dashboard is live immediately." },
  { q: "How does the 20% commission work?", a: "When a client you referred upgrades to any paid plan, you earn 20% of their subscription value. Commissions are tracked in your dashboard." },
  { q: "Can I manage my clients' sites?", a: "Yes. Any site referred through your link appears in your Agent dashboard. You can visit the site directly." },
  { q: "Who is this for?", a: "Web developers, digital agencies, freelancers, or anyone who works with local businesses and wants a recurring revenue stream." },
  { q: "How do I get paid?", a: "Payouts are processed manually by the Passive Coder team. Contact support once your balance reaches the minimum threshold." },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold px-4 py-2 rounded-full border border-indigo-500/20 mb-8">
            <Zap className="w-3 h-3" /> Agent Program · Free to Join
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Turn Your Network Into{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-orange-400 bg-clip-text text-transparent">
              Recurring Revenue
            </span>
          </h1>
          <p className="mt-6 text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Join the Passive Coder Agent program. Refer clients, earn 20% commission on every subscription, and manage all their sites from your own dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/become-agent"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-xl transition-all hover:scale-105 shadow-xl shadow-indigo-900/50 text-base"
            >
              Become an Agent — Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Already an Agent? Sign In
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-500" /> Instant approval</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-500" /> 20% recurring commission</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-orange-500" /> No fees ever</span>
          </div>
        </div>
      </section>

      {/* Perks grid */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold">Everything you get as an Agent</h2>
            <p className="text-gray-500 mt-3">One free signup. Full access. Immediate earning potential.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERKS.map(perk => (
              <div key={perk.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:border-gray-700 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${perk.color}`}>
                  <perk.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white">{perk.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-gray-800 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold">How it works</h2>
            <p className="text-gray-500 mt-3">Four steps from signup to earning.</p>
          </div>
          <div className="space-y-6">
            {STEPS.map(step => (
              <div key={step.step} className="flex items-start gap-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="text-4xl font-black text-indigo-600/30 shrink-0 leading-none">{step.step}</div>
                <div>
                  <h3 className="font-bold text-white text-lg">{step.title}</h3>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="font-semibold text-white">{faq.q}</p>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold">Ready to start earning?</h2>
          <p className="text-gray-400">Sign up in 2 minutes. No fees. No approval wait. Start referring immediately.</p>
          <Link
            href="/become-agent"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-xl transition-all hover:scale-105 shadow-xl shadow-indigo-900/50 text-lg"
          >
            Join as Agent — Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
