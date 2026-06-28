import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const metadata = { title: "Terms of Service — Passive Coder" };

export default async function TermsPage() {
  if ((await headers()).get("x-tenant-id")) notFound();
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Passive Coder, you agree to be bound by these Terms of Service. If you do not agree, do not use our service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Service Description</h2>
            <p>Passive Coder provides a website builder platform for local service businesses. Features vary by plan. We reserve the right to modify or discontinue features with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the security of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Payment & Refunds</h2>
            <p>Subscriptions are billed annually. See our <Link href="/refund" className="text-orange-500 hover:underline">Refund Policy</Link> for details on cancellations and refunds.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You may not use our platform to distribute spam, malware, illegal content, or infringe on third-party intellectual property. Violations may result in account suspension without refund.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>Our liability is limited to the amount you paid in the 3 months preceding any claim. We are not liable for indirect, consequential, or incidental damages.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact</h2>
            <p>Questions? <Link href="/contact" className="text-orange-500 hover:underline">Contact us</Link>.</p>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
