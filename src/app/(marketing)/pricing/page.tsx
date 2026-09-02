import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TenantPageWithChrome } from "@/components/site/tenant-page-with-chrome";

export const metadata = { title: "Pricing — Passive Coder" };

// Pricing lives as a section on the marketing homepage, but /pricing is what
// people type and what ads link to — without this route it fell through to the
// tenant catch-all and rendered a 404.
export default async function PricingPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (tenantId) return <TenantPageWithChrome tenantId={tenantId} slug="pricing" />;
  redirect("/#pricing");
}
