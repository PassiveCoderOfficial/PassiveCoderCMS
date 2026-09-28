import Link from "next/link";
import { ShieldCheck, CreditCard, CalendarX, ArrowRight } from "lucide-react";

/**
 * Risk reversal, straight from the published refund policy (/refund) — every
 * promise here must stay true to that page. If the policy changes, change
 * this too.
 */
const PROMISES = [
  { icon: ShieldCheck, title: "14-day money-back guarantee", body: "Not happy in your first 14 days? Ask for a full refund. No forms, no arguments." },
  { icon: CreditCard, title: "No payment to get started", body: "Sign up and build your site first. You only pay when you choose your plan." },
  { icon: CalendarX, title: "Cancel anytime", body: "Stop with one click. Your site stays live until the end of what you paid for." },
];

export default function GuaranteeSection() {
  return (
    <section className="bg-[#05060a] py-20 sm:py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.02] to-transparent p-8 sm:p-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Try it with nothing to lose</h2>
            <p className="mt-4 text-lg text-slate-400">
              We only do well when your website brings you customers, so the risk sits with us, not you.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {PROMISES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="mt-4 font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 bg-white text-slate-950 font-semibold px-7 py-3.5 rounded-xl hover:-translate-y-0.5 transition-transform">
              Get my website <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/refund" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-slate-300 hover:text-white">
              Read the refund policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
