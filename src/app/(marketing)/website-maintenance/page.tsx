import { headers } from "next/headers";
import type { Metadata } from "next";
import { rootBuilderTenantFor } from "@/lib/site/root-builder";
import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";
import { TenantPageWithChrome } from "@/components/site/tenant-page-with-chrome";
import { loadCatalog } from "@/lib/pricing/load";
import CarePlans from "./care-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website Maintenance & Care Plans — Passive Coder",
  description:
    "Website maintenance plans with hosting, domain renewal, monthly updates, new pages, SEO checks and priority support. Monthly, or yearly with 4 months free.",
  alternates: { canonical: "/website-maintenance" },
};

export default async function WebsiteMaintenancePage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (tenantId) return <TenantPageWithChrome tenantId={tenantId} slug="website-maintenance" />;
  const rootTenant = await rootBuilderTenantFor("website-maintenance");
  if (rootTenant) return <TenantPageWithChrome tenantId={rootTenant} slug="website-maintenance" />;
  const { care } = await loadCatalog();
  return (
    <div className="min-h-screen bg-[#05060a]">
      <MarketingNav />
      <CarePlans care={care} />
      <FooterSection />
    </div>
  );
}
