import Link from "next/link";
import { Store, Clock, Ban } from "lucide-react";
import { vendorApplicationStatus } from "@/lib/marketplace-ecom/vendor-auth";

export const metadata = { title: "Seller application" };

/** Status page for a seller whose shop isn't live yet. Deliberately outside
 *  the /vendor/(portal) layout: that layout redirects here, so living under it
 *  would loop. */
export default async function VendorPendingPage() {
  const status = await vendorApplicationStatus();
  const suspended = status === "suspended";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            suspended ? "bg-[#FEF3F2]" : "bg-[#FFF6F2]"
          }`}
        >
          {suspended ? (
            <Ban className="w-7 h-7 text-[#D92D20]" />
          ) : (
            <Store className="w-7 h-7 text-[#FF5A1F]" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-[#1A1330]">
          {suspended ? "Your shop is paused" : "Application under review"}
        </h1>

        <p className="text-[#667085] leading-relaxed">
          {suspended
            ? "Your seller account has been paused. Get in touch with the marketplace team to sort it out and get selling again."
            : "Thanks for applying. We're checking your details and will get back to you shortly. You'll be able to sign in and list products as soon as your shop is approved."}
        </p>

        {!suspended && (
          <p className="text-sm text-[#98A2B3] flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> Reviews usually finish within 1–2 working days.
          </p>
        )}

        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Link
            href="/"
            className="inline-block bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            Back to shop
          </Link>
          <Link
            href="/vendor"
            className="inline-block border border-[#EAECF0] hover:bg-[#F9FAFB] text-[#1A1330] px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            How selling works
          </Link>
        </div>
      </div>
    </div>
  );
}
