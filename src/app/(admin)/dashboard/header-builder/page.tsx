import { createAdminClient } from "@/lib/supabase/server";
import { styleText } from "@/lib/security/style-text";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { toBlocks } from "@/lib/site/global-blocks";
import { safeReturnTo } from "@/lib/site/return-to";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildSiteTheme, type SiteThemeInput } from "@/modules/themes/site-theme";
import { resolveLiveHeader } from "@/modules/header-studio/doc";
import { resolveLiveFooter } from "@/modules/footer-studio/doc";
import HeaderBuilderClient, { type HeaderTarget } from "./header-builder-client";

export default async function HeaderBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; returnTo?: string }>;
}) {
  const { target: rawTarget, returnTo: rawReturnTo } = await searchParams;
  const target: HeaderTarget = rawTarget === "footer" ? "footer" : "header";
  // Untrusted — comes straight from the URL. See safeReturnTo.
  const returnTo = safeReturnTo(rawReturnTo);

  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No site selected.</p>
      </div>
    );
  }

  const admin = await createAdminClient();
  const { data } = await admin
    .from("site_identity")
    .select("global_header, global_footer, template_id, color_overrides, design_overrides")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // Is a Studio header/footer live? Then visitors do not see the classic one
  // edited here: the builder says so (P0). Own query: the studio columns may
  // be missing (migrations 240/241), which only means "classic".
  const { data: studios } = await admin
    .from("site_identity")
    .select("header_studio, footer_studio")
    .eq("tenant_id", tenantId)
    .maybeSingle()
    .then((r) => r, () => ({ data: null }));
  const studioLive = target === "header"
    ? !!resolveLiveHeader((studios as { header_studio?: unknown } | null)?.header_studio)
    : !!resolveLiveFooter((studios as { footer_studio?: unknown } | null)?.footer_studio);

  const initialBlocks = toBlocks(
    target === "header" ? data?.global_header : data?.global_footer,
  );

  // Same gap the page editor had before it was fixed: without this the header
  // and footer builder rendered the bare shadcn default palette instead of
  // the tenant's brand colors, so a header built here looked nothing like
  // the same header on the published site. Scoped to .cms-canvas-light (added
  // around the canvas in the client), same trick the page editor uses so this
  // stays confined to block content and never fights the admin's own
  // dark/light toggle.
  const templateIdentity = data?.template_id
    ? await resolveDbTemplateIdentity(data.template_id)
    : null;
  const { css: templateCSSVars } = buildSiteTheme(data as SiteThemeInput | null, templateIdentity, ".cms-canvas-light");
  const templateCustomCss = templateIdentity?.customCss ?? null;

  return (
    <>
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      {templateCustomCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: styleText(templateCustomCss) }} />}
      <HeaderBuilderClient
        target={target}
        initialBlocks={initialBlocks}
        tenantId={tenantId}
        returnTo={returnTo}
        studioLive={studioLive}
      />
    </>
  );
}
