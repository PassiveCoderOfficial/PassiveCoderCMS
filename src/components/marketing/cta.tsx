import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Settings {
  hero_cta_text?: string;
  hero_cta_url?: string;
}

export default function CtaSection({ settings }: { settings: Settings | null }) {
  return (
    <section className="py-24 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Ready to get your business online?
        </h2>
        <p className="mt-4 text-orange-100 text-lg max-w-xl mx-auto">
          Join businesses across Dubai, Malaysia, Singapore, Qatar and more — all launched with Passive Coder.
          Start your free 24-hour trial today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link
            href={settings?.hero_cta_url ?? "/onboarding"}
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors shadow-xl text-base"
          >
            {settings?.hero_cta_text ?? "Start Free Trial"}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-8 py-4 rounded-xl hover:border-white hover:bg-white/10 transition-colors text-base"
          >
            Talk to Sales
          </Link>
        </div>
        <p className="text-orange-200 text-xs mt-6">No credit card required · Cancel anytime · Setup in minutes</p>
      </div>
    </section>
  );
}
