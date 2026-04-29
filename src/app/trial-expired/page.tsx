import Link from "next/link";
import { Clock, CreditCard, ArrowRight } from "lucide-react";

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Trial Expired</h1>
          <p className="mt-3 text-gray-400">
            Your 7-day free trial has ended. Upgrade to keep your site live and all your content intact.
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 text-left">
          <p className="text-sm font-semibold text-white">What happens when you upgrade:</p>
          <ul className="space-y-2 text-sm text-gray-400">
            {[
              "Your site goes live instantly",
              "All content and pages are preserved",
              "Custom domain stays connected",
              "No setup required — pick up where you left off",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/subscription"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all"
          >
            <CreditCard className="w-5 h-5" /> Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
