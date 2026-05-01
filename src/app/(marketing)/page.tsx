import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import MarketingNav from "@/components/marketing/nav";
import HeroSection from "@/components/marketing/hero";
import FeaturesSection from "@/components/marketing/features";
import TemplatesShowcase from "@/components/marketing/templates-showcase";
import HowItWorksSection from "@/components/marketing/how-it-works";
import ClientsSection from "@/components/marketing/clients";
import PricingSection from "@/components/marketing/pricing";
import TestimonialsSection from "@/components/marketing/testimonials";
import FaqSection from "@/components/marketing/faq";
import CtaSection from "@/components/marketing/cta";
import AgentCtaSection from "@/components/marketing/agent-cta";
import FooterSection from "@/components/marketing/footer";
import AnnouncementBar from "@/components/marketing/announcement-bar";
import { PageRenderer } from "@/components/site/page-renderer";
import type { Block } from "@/types/cms";

export const dynamic = "force-dynamic";

export default async function MarketingHomePage() {
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const supabase = await createAdminClient();

  // ── Tenant subdomain hit the root "/" ──────────────────────────────────────
  // The (site)/[...slug] catch-all only fires for /something, not /
  // So we handle the tenant homepage here.
  if (tenantId) {
    const { data: tenantPage } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", "home")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .maybeSingle();

    const blocks: Block[] = Array.isArray(tenantPage?.blocks) ? tenantPage!.blocks as Block[] : [];

    if (blocks.length > 0) {
      return (
        <div className="min-h-screen">
          <PageRenderer blocks={blocks} />
        </div>
      );
    }

    // Tenant exists but has no published home page yet
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6">
        <div className="max-w-lg text-center space-y-6">
          <div className="text-6xl">🚀</div>
          <h1 className="text-4xl font-bold">Your site is ready</h1>
          <p className="text-slate-400 text-lg">
            Head to the dashboard to create your first page and publish it as{" "}
            <code className="text-blue-400 bg-slate-700 px-1.5 py-0.5 rounded text-sm">home</code>.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            Go to Dashboard →
          </a>
        </div>
      </div>
    );
  }

  // ── Root domain: marketing homepage ───────────────────────────────────────
  const [{ data: settings }, { data: plans }, { data: rootPage }] = await Promise.all([
    supabase.from("homepage_settings").select("*").single(),
    supabase.from("plans").select("*").order("sort_order"),
    supabase
      .from("pages")
      .select("*")
      .eq("slug", "home")
      .eq("status", "published")
      .is("tenant_id", null)
      .maybeSingle(),
  ]);

  if (rootPage?.blocks && Array.isArray(rootPage.blocks) && rootPage.blocks.length > 0) {
    const blocks = rootPage.blocks as Block[];
    return (
      <div className="min-h-screen bg-white text-gray-900">
        {settings?.announcement_enabled && (
          <AnnouncementBar text={settings.announcement_text} url={settings.announcement_url} />
        )}
        <PageRenderer blocks={blocks} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {settings?.announcement_enabled && (
        <AnnouncementBar text={settings.announcement_text} url={settings.announcement_url} />
      )}
      <MarketingNav />
      <main>
        <HeroSection settings={settings} />
        <FeaturesSection />
        <TemplatesShowcase />
        <HowItWorksSection />
        <ClientsSection />
        <PricingSection plans={plans ?? []} />
        <TestimonialsSection testimonials={settings?.testimonials ?? []} />
        <FaqSection faq={settings?.faq ?? []} />
        <AgentCtaSection />
        <CtaSection settings={settings} />
      </main>
      <FooterSection />
    </div>
  );
}
