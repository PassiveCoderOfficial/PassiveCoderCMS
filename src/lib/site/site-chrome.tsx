import { styleText } from "@/lib/security/style-text";
import React from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { CartProvider } from "@/lib/cart/cart-context";
import { fetchGlobalLayout } from "@/lib/site/global-blocks";
import { getStudioHeader, type StudioHeaderData } from "@/lib/site/header-studio";
import { StudioSiteHeader } from "@/components/site/header-studio/studio-site-header";
import { getStudioFooter, type StudioFooterData } from "@/lib/site/footer-studio";
import { StudioSiteFooter } from "@/components/site/footer-studio/studio-site-footer";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildSiteTheme, type SiteThemeInput } from "@/modules/themes/site-theme";
import { loadFixtureChrome } from "@/lib/site/design-fixture";
import type { Block } from "@/types/cms";

/**
 * A site's header, footer and theme, for coded pages that sit outside the
 * builder (the 404 page, the templates list): they wrap their own content in
 * the same chrome a builder page gets. On a local design preview
 * (PC_FIXTURE_DIR, never in production) the header, footer and theme of the
 * fixture files replace the saved ones.
 */
export type SiteChrome = { tenantId: string; header: Block[]; studio: StudioHeaderData | null; footer: Block[]; studioFooter: StudioFooterData | null; css: string; customCss: string | null; name: string | null };

export async function loadSiteChrome(tenantId: string, { fixture = false }: { fixture?: boolean } = {}): Promise<SiteChrome | null> {
  try {
    const admin = await createAdminClient();
    const [layout, { data: identity }, studio, studioFooter, fx] = await Promise.all([
      fetchGlobalLayout(tenantId),
      admin.from("site_identity").select("template_id, color_overrides, design_overrides, site_name").eq("tenant_id", tenantId).maybeSingle(),
      getStudioHeader(tenantId),
      getStudioFooter(tenantId),
      fixture ? loadFixtureChrome() : Promise.resolve(null),
    ]);
    const template = identity?.template_id ? await resolveDbTemplateIdentity(identity.template_id) : null;
    const themed: SiteThemeInput | null = fx
      ? {
        color_overrides: { ...((identity?.color_overrides as SiteThemeInput["color_overrides"]) ?? {}), ...(fx.identity?.color_overrides ?? {}) },
        design_overrides: { ...((identity?.design_overrides as SiteThemeInput["design_overrides"]) ?? {}), ...(fx.identity?.design_overrides ?? {}) },
      }
      : (identity as SiteThemeInput | null);
    const { css } = buildSiteTheme(themed, template);
    return {
      tenantId, css, customCss: template?.customCss ?? null, name: (identity?.site_name as string | null) ?? null,
      header: fx?.header?.length ? fx.header : layout.header, studio: fx?.header?.length ? null : studio,
      footer: fx?.footer?.length ? fx.footer : layout.footer, studioFooter: fx?.footer?.length ? null : studioFooter,
    };
  } catch {
    return null;
  }
}

/** Header, the page's own content, footer. `chrome` null = the content alone. */
export function SiteChromeShell({ chrome, children, mainClassName = "flex flex-1 items-center" }: { chrome: SiteChrome | null; children: React.ReactNode; mainClassName?: string }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        {chrome && <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: chrome.css }} />}
        {chrome?.customCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: styleText(chrome.customCss) }} />}
        {chrome?.studio ? <StudioSiteHeader tenantId={chrome.tenantId} data={chrome.studio} /> : chrome && chrome.header.length > 0 && <PageRenderer blocks={chrome.header} />}
        <main className={mainClassName}>{children}</main>
        {chrome?.studioFooter ? <StudioSiteFooter tenantId={chrome.tenantId} data={chrome.studioFooter} /> : chrome && chrome.footer.length > 0 && <PageRenderer blocks={chrome.footer} />}
      </div>
    </CartProvider>
  );
}
