import { createAdminClient } from "@/lib/supabase/server";
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

export const revalidate = 60;

export default async function MarketingHomePage() {
  const supabase = await createAdminClient();

  const [{ data: settings }, { data: plans }, { data: rootPage }] = await Promise.all([
    supabase.from("homepage_settings").select("*").single(),
    supabase.from("plans").select("*").order("sort_order"),
    // Root homepage managed from page manager: slug="home", tenant_id IS NULL
    supabase
      .from("pages")
      .select("*")
      .eq("slug", "home")
      .eq("status", "published")
      .is("tenant_id", null)
      .maybeSingle(),
  ]);

  // If SA has built a custom homepage in the page manager, render it
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

  // Fallback: static marketing homepage
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
