import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TenantPageWithChrome } from "@/components/site/tenant-page-with-chrome";

export const metadata = { title: "প্রবাসী ব্যবসায়ীদের জন্য ওয়েবসাইট — Passive Coder" };

// Short link for the Bangladesh landing page. A spoken CTA in a video needs
// something a person can retype from memory — nobody types
// /website-for-bangladeshi-businesses off a screen.
//
// A route rather than a middleware rule: the marketing route group already
// only renders on the root domain, and a tenant with its own /bd page still
// gets it through the same tenant-aware branch every other marketing route
// uses.
export default async function BdShortLink() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (tenantId) return <TenantPageWithChrome tenantId={tenantId} slug="bd" />;
  redirect("/website-for-bangladeshi-businesses");
}
