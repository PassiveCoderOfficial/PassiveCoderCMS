import { createAdminClient, createClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { fetchGlobalLayout, toBlocks, shouldInjectPrefooter } from "@/lib/site/global-blocks";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildTemplateCSSVars } from "@/modules/themes/template-css";
import type { Block } from "@/types/cms";
import type { TemplatePalette } from "@/modules/themes/template-types";

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
      .select("template_id, color_overrides")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  const templateIdentity = identity?.template_id
    ? await resolveDbTemplateIdentity(identity.template_id)
    : null;

  // Roughly half of tenants have never had a template applied — give them the
  // same neutral branded default (identical to the (site) layout's fallback)
  // instead of falling through to the bare shadcn slate palette.
  const FALLBACK_PALETTE: TemplatePalette = {
    primary: "#2563EB", primaryFg: "#ffffff",
    secondary: "#0F172A", accent: "#38BDF8",
    background: "#FFFFFF", foreground: "#0F172A",
    muted: "#F1F5F9", mutedFg: "#64748B",
    card: "#FFFFFF", border: "#E2E8F0", ring: "#2563EB",
    borderRadius: "0.75rem",
  };
  const FALLBACK_TYPOGRAPHY = {
    headingFont: "Inter", bodyFont: "Inter",
    headingWeight: "700", letterSpacing: "-0.02em",
  };

  const colorOverrides = (identity?.color_overrides ?? null) as Partial<TemplatePalette> | null;
  const mergedPalette = templateIdentity
    ? { ...templateIdentity.palette, ...(colorOverrides ?? {}) }
    : { ...FALLBACK_PALETTE, ...(colorOverrides ?? {}) };
  const templateCSSVars = buildTemplateCSSVars(mergedPalette, templateIdentity?.typography ?? FALLBACK_TYPOGRAPHY);
  const templateCustomCss = templateIdentity?.customCss ?? null;

  const blocks: Block[] = toBlocks(page?.blocks);
  const { header, footer, prefooter } = layout;
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
