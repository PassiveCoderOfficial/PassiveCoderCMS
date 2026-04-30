import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const [{ data: settings }, identityResult] = await Promise.all([
    supabase.from("site_settings").select("site_name, meta_description, site_description").single(),
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_identity").select("site_name, favicon_url").eq("tenant_id", tenantId).single()
        )
      : Promise.resolve({ data: null }),
  ]);
  const identity = identityResult?.data ?? null;

  const siteName = identity?.site_name ?? settings?.site_name ?? "CMS Site";
  const faviconUrl = identity?.favicon_url ?? null;

  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description: settings?.meta_description ?? settings?.site_description,
    ...(faviconUrl && {
      icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl },
    }),
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("site_theme, custom_css, custom_js, analytics_code")
    .single();

  const siteTheme = settings?.site_theme ?? "system";

  // For fixed themes inject the class immediately via a tiny inline script (no flash).
  // For "system" we use a media query approach.
  const themeScript =
    siteTheme === "light"
      ? `document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');`
      : siteTheme === "dark"
      ? `document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');`
      : `(function(){var d=document.documentElement;if(window.matchMedia('(prefers-color-scheme: dark)').matches){d.classList.add('dark');d.classList.remove('light');}else{d.classList.add('light');d.classList.remove('dark');}})();`;

  return (
    <>
      {/* Inline script runs before paint — no theme flash */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {settings?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: settings.custom_css }} />
      )}
      {children}
      {settings?.analytics_code && (
        <div dangerouslySetInnerHTML={{ __html: settings.analytics_code }} />
      )}
      {settings?.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: settings.custom_js }} />
      )}
    </>
  );
}
