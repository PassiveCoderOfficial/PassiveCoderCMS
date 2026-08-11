import Link from "next/link";
import { Store, Clock } from "lucide-react";

export const metadata = { title: "Seller application — Seller Centre" };

/** Shown to signed-in users who have no approved ecommerce vendor account.
 *  Deliberately outside the /vendor layout: that layout redirects here, so
 *  living under it would loop. */
export default function VendorPendingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center mx-auto">
          <Store className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Seller account not active yet</h1>
        <p className="text-gray-400">
          Your shop is either still under review or has been paused. The marketplace team
          approves new sellers after checking trade licence and contact details.
        </p>
        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> Reviews usually finish within 1–2 working days.
        </p>
        <Link
          href="/"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
