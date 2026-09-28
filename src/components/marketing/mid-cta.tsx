import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

const WHATSAPP = "https://wa.me/8801678669699?text=" + encodeURIComponent("Hi Passive Coder, I want a website for my business.");

/**
 * Mid-page call to action, placed right after the industry tiles: the moment
 * a visitor has seen real client sites and found their own trade, give them
 * the next step instead of making them scroll to the end.
 */
export default function MidCtaSection() {
  return (
    <section className="bg-[#05060a] pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-rose-500 to-orange-600 px-6 py-10 sm:px-12 sm:py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">See your business online today</h2>
            <p className="mt-2 text-white/85">
              Tell us your trade and we set up your site with your name, services and a WhatsApp button. Free to start, no card needed.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 bg-white text-slate-950 font-semibold px-6 py-3.5 rounded-xl hover:-translate-y-0.5 transition-transform">
              Get my website <ArrowRight className="w-4 h-4" />
            </Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-black/20 text-white font-semibold px-6 py-3.5 rounded-xl ring-1 ring-white/30 hover:bg-black/30">
              <MessageCircle className="w-4 h-4" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
