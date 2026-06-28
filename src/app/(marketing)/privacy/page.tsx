import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";
import Link from "next/link";
import { headers } from "next/headers";
import { TenantPageWithChrome } from "@/components/site/tenant-page-with-chrome";

export const metadata = { title: "Privacy Policy — Passive Coder" };

export default async function PrivacyPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (tenantId) return <TenantPageWithChrome tenantId={tenantId} slug="privacy" />;
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly — including your name, email address, and payment details when you create an account or subscribe to a plan. We also collect usage data such as pages visited, features used, and performance metrics to improve our service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>Your information is used to operate and improve our platform, process payments, send service notifications, and provide customer support. We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Storage & Security</h2>
            <p>Your data is stored securely on Supabase infrastructure. We use industry-standard encryption for data in transit and at rest. Access to your data is restricted to authorized personnel only.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. To delete your account and all associated data, please reach out via our <Link href="/contact" className="text-orange-500 hover:underline">contact page</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact</h2>
            <p>Questions about this policy? <Link href="/contact" className="text-orange-500 hover:underline">Contact us</Link>.</p>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
