import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";
import Link from "next/link";

export const metadata = { title: "Refund Policy — Passive Coder" };

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">14-Day Money-Back Guarantee</h2>
            <p>If you are not satisfied with your subscription, you may request a full refund within 14 days of your initial payment. To request a refund, contact us within this window.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Renewals</h2>
            <p>Annual subscription renewals are non-refundable after 14 days of the renewal date. You may cancel at any time to prevent future renewals — your site will remain active until the end of the billing period.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Free Trial</h2>
            <p>No payment is taken during the 7-day free trial. You will only be charged if you choose to upgrade to a paid plan.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How to Cancel</h2>
            <p>Cancel anytime from your dashboard under Settings → Subscription. Your site stays live until the end of the paid period.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
            <p>To request a refund or ask questions, <Link href="/contact" className="text-orange-500 hover:underline">contact our team</Link>. We typically respond within 1 business day.</p>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
