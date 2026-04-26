"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem { q: string; a: string; }

const DEFAULT_FAQ: FaqItem[] = [
  { q: "Do I need any technical skills?", a: "None at all. If you can type and click, you can build a site with CMS Studio. Our visual editor lets you see changes as you make them." },
  { q: "Can I try before paying?", a: "Yes — every plan comes with a 24-hour free trial. Full access, no credit card required. You only pay when you decide to keep it." },
  { q: "What happens to my site if I cancel?", a: "We'll notify you before any suspension. You can export all your data (JSON, CSV, WordPress format) at any time from your backups page." },
  { q: "Can I use my own domain?", a: "Absolutely. You can buy a domain through us (included in your plan) or connect one you already own. We'll walk you through the DNS setup step by step." },
  { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards via Paddle, and ShurjoPay for Bangladeshi customers. You can also contact our sales team for manual/invoice payment." },
  { q: "Is ecommerce included?", a: "Yes, fully. You can add products, manage orders, set up shipping, and accept payments — all within your plan at no extra cost." },
  { q: "Can I switch plans later?", a: "Yes. You can upgrade or downgrade at any time from your settings. Upgrades take effect immediately, downgrades at the next billing cycle." },
  { q: "Who handles support?", a: "Real humans. Standard plan gets our support team (business hours). Premium plan gets VIP priority support with faster response times." },
];

export default function FaqSection({ faq }: { faq: FaqItem[] }) {
  const items = faq.length > 0 ? faq : DEFAULT_FAQ;
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
