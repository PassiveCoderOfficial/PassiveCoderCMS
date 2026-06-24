import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getTemplateIdentity } from "@/modules/themes/template-registry";
import { buildTemplateCSSVars, buildTemplateBodyScript } from "@/modules/themes/template-css";
import { PageRenderer } from "@/components/site/page-renderer";
import type { Block } from "@/types/cms";

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

  const siteName = (identity as { site_name?: string } | null)?.site_name ?? settings?.site_name ?? "CMS Site";
  const faviconUrl = (identity as { favicon_url?: string } | null)?.favicon_url ?? null;

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
          admin.from("site_identity")
            .select("active_template_slug, logo_url, logo_dark_url, site_name, tagline, global_header, global_footer")
            .eq("tenant_id", tenantId)
            .single()
        )
      : Promise.resolve({ data: null }),
  ]);

  const settings = settingsResult?.data;
  const identity = identityResult?.data as {
    active_template_slug?: string;
    logo_url?: string;
    logo_dark_url?: string;
    site_name?: string;
    tagline?: string;
    global_header?: Block[] | null;
    global_footer?: Block[] | null;
  } | null;

  const activeTemplateSlug = identity?.active_template_slug ?? null;
  const templateIdentity = activeTemplateSlug ? getTemplateIdentity(activeTemplateSlug) : null;

  const siteTheme = settings?.site_theme ?? "system";

  const themeScript =
    siteTheme === "light"
      ? `document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');`
      : siteTheme === "dark"
      ? `document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');`
      : `(function(){var d=document.documentElement;if(window.matchMedia('(prefers-color-scheme: dark)').matches){d.classList.add('dark');d.classList.remove('light');}else{d.classList.add('light');d.classList.remove('dark');}})();`;

  const templateCSSVars = templateIdentity
    ? buildTemplateCSSVars(templateIdentity.palette, templateIdentity.typography)
    : null;
  const templateBodyScript = templateIdentity
    ? buildTemplateBodyScript(templateIdentity.slug)
    : null;
  const templateCustomCss = templateIdentity?.customCss ?? null;

  // Global header/footer — stored as single Block object OR Block[] array
  function toBlockArray(val: unknown): Block[] {
    if (!val) return [];
    if (Array.isArray(val)) return val as Block[];
    if (typeof val === "object" && (val as Record<string, unknown>).type) return [val as Block];
    return [];
  }
  const globalHeader: Block[] = toBlockArray(identity?.global_header);
  const globalFooter: Block[] = toBlockArray(identity?.global_footer);

  return (
    <>
      {/* Theme flash prevention */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {templateCSSVars && (
        <style dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      )}
      {templateBodyScript && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script dangerouslySetInnerHTML={{ __html: templateBodyScript }} />
      )}
      {templateCustomCss && (
        <style dangerouslySetInnerHTML={{ __html: templateCustomCss }} />
      )}
      {settings?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: settings.custom_css }} />
      )}

      {/* Persistent global header (navigation block managed site-wide) */}
      {globalHeader.length > 0 && (
        <PageRenderer blocks={globalHeader} />
      )}

      {/* Page content */}
      {children}

      {/* Persistent global footer */}
      {globalFooter.length > 0 && (
        <PageRenderer blocks={globalFooter} />
      )}

      {settings?.analytics_code && (
        <div dangerouslySetInnerHTML={{ __html: settings.analytics_code }} />
      )}
      {settings?.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: settings.custom_js }} />
      )}
    </>
  );
}
