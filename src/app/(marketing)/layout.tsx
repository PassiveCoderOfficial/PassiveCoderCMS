import type { Metadata } from "next";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createAdminClient();
  const tenantId = (await headers()).get("x-tenant-id");

  // Tenant subdomain: use the tenant's branding + favicon (marketing root domain falls
  // back to the platform homepage settings).
  if (tenantId) {
    const { data: identity } = await supabase
      .from("site_identity")
      .select("site_name, favicon_url")
      .eq("tenant_id", tenantId)
      .single();
    const fav = identity?.favicon_url ?? null;
    return {
      title: { default: identity?.site_name ?? "Home", template: `%s | ${identity?.site_name ?? ""}` },
      ...(fav && { icons: { icon: fav, shortcut: fav, apple: fav } }),
    };
  }

  const { data } = await supabase.from("homepage_settings").select("meta_title,meta_description").single();
  return {
    title: data?.meta_title ?? "Passive Coder — Website Builder for Local Businesses",
    description: data?.meta_description ?? "Professional websites for local service businesses.",
  };
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsAppButton />
    </>
  );
}
