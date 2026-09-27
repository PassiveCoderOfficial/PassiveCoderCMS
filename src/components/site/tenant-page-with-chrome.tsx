import { createAdminClient, createClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { fetchGlobalLayout, toBlocks, shouldInjectPrefooter, isChromeBlock } from "@/lib/site/global-blocks";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildSiteTheme, type SiteThemeInput } from "@/modules/themes/site-theme";
import type { Block } from "@/types/cms";

/**
 * Renders a tenant's DB page (by slug) wrapped in the global header + footer.
 * Used by explicit (marketing) routes that win over the (site) catch-all on
 * tenant subdomains (contact, pricing, privacy, terms, refund, etc.) so they
 * still show the site chrome instead of 404ing.
 *
 * Also injects the tenant's template CSS vars — same resolve + build the
 * (site) layout and the homepage's own tenant branch use. Without this these
 * routes rendered on the bare shadcn default palette (navy/slate) instead of
 * the tenant's brand colors, so a page built and previewed correctly in the
 * editor came out with the wrong CTA button color, wrong accents, etc. the
 * moment it published — the one difference between editor and live that
 * this component alone was responsible for.
 */
export async function TenantPageWithChrome({ tenantId, slug }: { tenantId: string; slug: string }) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const [{ data: page }, layout, { data: identity }] = await Promise.all([
    supabase.from("pages").select("*").eq("slug", slug).eq("status", "published").eq("tenant_id", tenantId).maybeSingle(),
    fetchGlobalLayout(tenantId),
    admin.from("site_identity")
      .select("template_id, color_overrides, design_overrides")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  const templateIdentity = identity?.template_id
    ? await resolveDbTemplateIdentity(identity.template_id)
    : null;

  const { css: templateCSSVars } = buildSiteTheme(identity as SiteThemeInput | null, templateIdentity);
  const templateCustomCss = templateIdentity?.customCss ?? null;

  const rawBlocks: Block[] = toBlocks(page?.blocks);
  const { header, footer, prefooter } = layout;
  // This component renders header/footer separately (below) whenever the
  // tenant has global chrome — a page's own nav/footer block must be
  // stripped the same way (site)/[...slug]/page.tsx and (marketing)/page.tsx
  // already do, or it renders twice. Missed here originally: found live
  // (2026-09-09) on afnanunited's /contact showing two full headers —
  // this is the third of three render paths a tenant page can take
  // (site catch-all, marketing homepage, and this one for /contact,
  // /pricing, /privacy, /terms, /refund), and only the first two got the
  // isChromeBlock fix when the double-render bug from the nav migration
  // was found and fixed. Same bug, same fix, third place it was hiding.
  const hasGlobalHeader = header.length > 0;
  const hasGlobalFooter = footer.length > 0;
  const blocks: Block[] = rawBlocks.filter((b) => {
    if (hasGlobalHeader && isChromeBlock(b, "header")) return false;
    if (hasGlobalFooter && isChromeBlock(b, "footer")) return false;
    return true;
  });
  const body = prefooter.length > 0 && shouldInjectPrefooter(blocks)
    ? [...blocks, ...prefooter]
    : blocks;
  return (
    <div className="min-h-screen">
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      {templateCustomCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: templateCustomCss }} />}
      {header.length > 0 && <PageRenderer blocks={header} />}
      <PageRenderer blocks={body} />
      {footer.length > 0 && <PageRenderer blocks={footer} />}
    </div>
  );
}
