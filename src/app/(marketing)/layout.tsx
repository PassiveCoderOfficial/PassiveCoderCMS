import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import Script from "next/script";
import { createAdminClient } from "@/lib/supabase/server";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { countVisit } from "@/lib/usage/count-visit";
import { recordPageView } from "@/lib/usage/record-page-view";

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
    const fav = identity?.favicon_url ?? "/branding/passivecoder-icon.png";
    return {
      title: { default: identity?.site_name ?? "Home", template: `%s | ${identity?.site_name ?? ""}` },
      icons: { icon: fav, shortcut: fav, apple: fav },
    };
  }

  const { data } = await supabase.from("homepage_settings").select("meta_title,meta_description").single();
  return {
    title: data?.meta_title ?? "Passive Coder — Website Builder for Local Businesses",
    description: data?.meta_description ?? "Professional websites for local service businesses.",
    icons: { icon: "/branding/passivecoder-icon.png", shortcut: "/branding/passivecoder-icon.png", apple: "/branding/passivecoder-icon.png" },
  };
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // This layout also serves tenant subdomains that hit these routes (see
  // generateMetadata above) — the support WhatsApp button must only show on
  // the root domain, never on a tenant's site, or tenants lose their own
  // visitor leads to our support number.
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  // Same gap the theme comment above already flags: tenant "/" renders here,
  // not through (site)/layout.tsx, so it also missed that layout's pageview
  // tracking entirely — every tenant homepage visit went uncounted in both
  // the billing allowance (tenant_visit_counters) and the analytics panel
  // (page_view_stats). Found by testing recordPageView end-to-end: every
  // OTHER path recorded correctly, only "/" never did — the opposite of what
  // it first looked like, since an early test on "/" happened to show a row
  // that (in hindsight) predated this fix and was likely leftover data.
  if (tenantId) {
    const userAgent = reqHeaders.get("user-agent");
    after(() => countVisit(tenantId, userAgent));
    after(() =>
      recordPageView(
        tenantId,
        "/",
        userAgent,
        reqHeaders.get("referer"),
        reqHeaders.get("host"),
        reqHeaders.get("x-vercel-ip-country"),
      ),
    );
  }

  // Tenant "/" is rendered here, not by (site)/layout.tsx, so it misses that
  // layout's theme handling. Pin the tenant's colour scheme (falling back to
  // light) so browser dark mode doesn't repaint native form controls and text.
  let scheme: string | null = null;
  // Same query also carries the tenant's own GA4 id — tenant "/" renders here,
  // not through (site)/layout.tsx where the gtag injection lives, so without
  // this the homepage (the page a client checks first, and the highest-traffic
  // one) was the ONE page on the site that never sent anything to their
  // Google Analytics. Fetched alongside site_theme rather than as a second
  // round-trip.
  let gaMeasurementId: string | null = null;
  if (tenantId) {
    const supabase = await createAdminClient();
    const { data } = await supabase.from("site_settings")
      .select("site_theme, ga_measurement_id").eq("tenant_id", tenantId).maybeSingle();
    const t = data?.site_theme ?? "light";
    if (t !== "system") scheme = t;
    gaMeasurementId = (data?.ga_measurement_id as string | null) ?? null;
  }

  return (
    <>
      {scheme === "light" && (
        <style precedence="pc-theme" dangerouslySetInnerHTML={{ __html: `
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
        <style precedence="pc-theme" dangerouslySetInnerHTML={{ __html: `:root{color-scheme:dark;}` }} />
      )}
      {children}
      {gaMeasurementId && (
        <>
          {/* Same injection as (site)/layout.tsx — the tenant's own GA4 tag,
              their measurement id, their account. We never read GA data back. */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');`}
          </Script>
        </>
      )}
      {!tenantId && <WhatsAppButton />}
    </>
  );
}
