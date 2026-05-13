import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getTemplateIdentity } from "@/modules/themes/template-registry";
import { buildTemplateCSSVars, buildTemplateBodyScript } from "@/modules/themes/template-css";

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
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const [settingsResult, identityResult] = await Promise.all([
    supabase.from("site_settings").select("site_theme, custom_css, custom_js, analytics_code").single(),
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_identity").select("active_template_slug").eq("tenant_id", tenantId).single()
        )
      : Promise.resolve({ data: null }),
  ]);

  const settings = settingsResult?.data;
  const activeTemplateSlug = (identityResult?.data as { active_template_slug?: string } | null)?.active_template_slug ?? null;
  const templateIdentity = activeTemplateSlug ? getTemplateIdentity(activeTemplateSlug) : null;

  const siteTheme = settings?.site_theme ?? "system";

  // For fixed themes inject the class immediately via a tiny inline script (no flash).
  // For "system" we use a media query approach.
  const themeScript =
    siteTheme === "light"
      ? `document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');`
      : siteTheme === "dark"
      ? `document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');`
      : `(function(){var d=document.documentElement;if(window.matchMedia('(prefers-color-scheme: dark)').matches){d.classList.add('dark');d.classList.remove('light');}else{d.classList.add('light');d.classList.remove('dark');}})();`;

  // Build template CSS vars — injected before paint so no flash
  const templateCSSVars = templateIdentity
    ? buildTemplateCSSVars(templateIdentity.palette, templateIdentity.typography)
    : null;
  const templateBodyScript = templateIdentity
    ? buildTemplateBodyScript(templateIdentity.slug)
    : null;
  const templateCustomCss = templateIdentity?.customCss ?? null;

  return (
    <>
      {/* Theme flash prevention */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {/* Template identity CSS vars — override Tailwind CSS vars site-wide */}
      {templateCSSVars && (
        <style dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      )}
      {/* Template body class for template-specific CSS rules */}
      {templateBodyScript && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script dangerouslySetInnerHTML={{ __html: templateBodyScript }} />
      )}
      {/* Template custom CSS (fonts, per-class overrides) */}
      {templateCustomCss && (
        <style dangerouslySetInnerHTML={{ __html: templateCustomCss }} />
      )}
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
