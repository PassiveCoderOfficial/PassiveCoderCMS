import Link from "next/link";
import { CheckCircle, Star, ArrowRight } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_yearly: number;
  storage_gb: number;
  domains: number;
  support_tier: string;
  features: string[];
}

export default function PricingSection({ plans }: { plans: Plan[] }) {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Simple, honest pricing</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            One annual price. Everything included. No monthly surprises.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full border border-green-200">
            <CheckCircle className="w-4 h-4" /> 7-day free trial — no credit card needed
          </div>
        </div>

        {!plans.length && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {["Standard", "Premium", "Custom"].map(name => (
              <div key={name} className="rounded-2xl border border-gray-200 bg-white p-8 animate-pulse">
                <div className="h-5 w-24 bg-gray-100 rounded mb-4" />
                <div className="h-10 w-20 bg-gray-100 rounded mb-6" />
                {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded mb-3 w-full" />)}
                <div className="h-10 bg-gray-100 rounded mt-8" />
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isPremium = plan.id === "premium";
            const isCustom = plan.id === "custom";
            const price = plan.price_yearly / 100;
            const features: string[] = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as unknown as string ?? "[]");

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  isPremium
                    ? "border-orange-500 shadow-xl shadow-orange-100 bg-gradient-to-b from-orange-50 to-white"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all"
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-current" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {isCustom ? (
                    <div className="mt-3">
                      <span className="text-3xl font-extrabold text-gray-900">Custom</span>
                      <p className="text-sm text-gray-500 mt-1">Tailored pricing for your needs</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                      <span className="text-gray-500 text-sm">/year</span>
                    </div>
                  )}
                  {!isCustom && (
                    <p className="text-xs text-gray-500 mt-1">${(price / 12).toFixed(2)}/month billed annually</p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPremium ? "text-orange-500" : "text-green-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={isCustom ? "/contact?dept=sales" : `/onboarding?plan=${plan.id}`}
                  className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all ${
                    isPremium
                      ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200"
                      : isCustom
                      ? "border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {isCustom ? "Contact Sales" : "Get Started"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          All plans include SSL, CDN, daily backups, page builder, ecommerce, and forms.
          Prices in USD. Annual billing only.
        </p>
      </div>
    </section>
  );
}
