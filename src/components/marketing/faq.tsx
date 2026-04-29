"use client";
import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

interface FaqItem { q: string; a: string; }

const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "Do I need any technical skills to build my site?",
    a: "None at all. Our visual editor works like Google Docs — you see what you're editing, live, as you type. If you can use a smartphone, you can build your site. Most business owners are live within 2 hours of signing up.",
  },
  {
    q: "How is Passive Coder different from Wix or Squarespace?",
    a: "Three things: (1) We're built specifically for local service businesses — templates are designed for your exact industry, not generic. (2) We offer real human support that knows your site, not a chatbot. (3) Our pricing is far lower — $199/year all-in vs $200+/year just for the basics on most platforms.",
  },
  {
    q: "Can I try before paying?",
    a: "Yes — every plan comes with a 7-day free trial. Full access to every feature, no credit card required. You only pay when you decide to keep it. If you cancel during the trial, you owe nothing.",
  },
  {
    q: "What happens to my site if I cancel?",
    a: "We'll give you at least 14 days notice before any suspension. You can export all your content (pages, images, form submissions) at any time from your dashboard. Your data is always yours.",
  },
  {
    q: "Can I use my own domain name?",
    a: "Absolutely. You can connect a domain you already own, or get a free .com/.net/.org domain included with your plan. We'll walk you through DNS setup step by step — it takes about 10 minutes.",
  },
  {
    q: "Is ecommerce really included?",
    a: "Yes, fully included at no extra cost. Add products, manage orders, set up shipping zones, and accept payments online — all within your plan. There's no Shopify-style transaction fee either.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Paddle, and ShurjoPay for Bangladeshi customers. You can also contact our sales team for manual payment or invoice billing.",
  },
  {
    q: "Will my site rank on Google?",
    a: "Every page is built with SEO best practices — meta tags, structured data, fast load times, mobile-first layout, and clean URLs. You can also add custom SEO titles, descriptions, and canonical URLs for every page. Most clients start appearing in local search results within 2–4 weeks of going live.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, anytime. Upgrade from Standard to Premium in one click from your settings. Downgrades take effect at your next billing cycle so you always get what you paid for.",
  },
  {
    q: "What kind of support do you provide?",
    a: "Real humans, not bots. Standard plan gets our support team during business hours (typically within 4 hours). Premium plan gets VIP priority support — we aim to respond within 1 hour, 7 days a week. We've helped clients with everything from DNS setup to writing their homepage copy.",
  },
];

export default function FaqSection({ faq }: { faq: FaqItem[] }) {
  const items = faq.length > 0 ? faq : DEFAULT_FAQ;
  const [open, setOpen] = useState<number | null>(0);

  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Got questions? We have answers.</h2>
          <p className="text-gray-500 mt-3 text-lg">Everything you need to know before signing up.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-3 items-start">
          {[left, right].map((col, ci) => (
            <div key={ci} className="space-y-3">
              {col.map((item, li) => {
                const i = ci === 0 ? li : li + half;
                return (
                  <div key={i} className={`border rounded-xl overflow-hidden transition-all ${open === i ? "border-orange-200 shadow-sm shadow-orange-50" : "border-gray-200"}`}>
                    <button
                      onClick={() => setOpen(open === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 text-sm pr-4 leading-snug">{item.q}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open === i ? "rotate-180 text-orange-500" : ""}`} />
                    </button>
                    {open === i && (
                      <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-orange-50/30">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-8 py-5">
            <MessageCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Still have questions?</p>
              <p className="text-gray-500 text-xs mt-0.5">Talk to a real person. We respond fast.</p>
            </div>
            <a
              href="/contact"
              className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
