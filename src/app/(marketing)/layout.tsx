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

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // This layout also serves tenant subdomains that hit these routes (see
  // generateMetadata above) — the support WhatsApp button must only show on
  // the root domain, never on a tenant's site, or tenants lose their own
  // visitor leads to our support number.
  const tenantId = (await headers()).get("x-tenant-id");

  // Tenant "/" is rendered here, not by (site)/layout.tsx, so it misses that
  // layout's theme handling. Pin the tenant's colour scheme (falling back to
  // light) so browser dark mode doesn't repaint native form controls and text.
  let scheme: string | null = null;
  if (tenantId) {
    const supabase = await createAdminClient();
    const { data } = await supabase.from("site_settings")
      .select("site_theme").eq("tenant_id", tenantId).maybeSingle();
    const t = data?.site_theme ?? "light";
    if (t !== "system") scheme = t;
  }

  return (
    <>
      {scheme === "light" && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root, html.dark, html.light { color-scheme: light; }
          html.dark {
            --background: 0 0% 100%; --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%; --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%; --popover-foreground: 222.2 84% 4.9%;
            --primary: 222.2 47.4% 11.2%; --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%; --secondary-foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%; --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96.1%; --accent-foreground: 222.2 47.4% 11.2%;
            --border: 214.3 31.8% 91.4%; --input: 214.3 31.8% 91.4%;
            --ring: 222.2 84% 4.9%;
          }
        ` }} />
      )}
      {scheme === "dark" && (
        <style dangerouslySetInnerHTML={{ __html: `:root{color-scheme:dark;}` }} />
      )}
      {children}
      {!tenantId && <WhatsAppButton />}
    </>
  );
}
