/**
 * One place that turns a tenant's site_identity into the theme CSS every
 * surface injects: live site layout, the "/" homepage, content pages rendered
 * with chrome, the page editor canvas and the header/footer builder.
 *
 * Each of those used to merge palette + overrides on its own, and they had
 * drifted: the page editor and the homepage ignored color_overrides entirely
 * (so the editor showed different colours from the live site), and the
 * homepage rendered unthemed for sites with no template. Now they all call
 * this, so a site looks the same everywhere it's shown.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { resolveDbTemplateIdentity, type ResolvedIdentity } from "@/modules/templates/resolve-identity";
import { buildTemplateCSSVars } from "./template-css";
import type { SiteDesign, TemplatePalette, TemplateTypography } from "./template-types";

/** Look for sites that never had a template applied: neutral and branded,
 *  not the bare shadcn slate. */
export const SITE_FALLBACK_PALETTE: TemplatePalette = {
  primary: "#2563EB", primaryFg: "#ffffff",
  secondary: "#0F172A", accent: "#38BDF8",
  background: "#FFFFFF", foreground: "#0F172A",
  muted: "#F1F5F9", mutedFg: "#64748B",
  card: "#FFFFFF", border: "#E2E8F0", ring: "#2563EB",
  borderRadius: "0.75rem",
};
export const SITE_FALLBACK_TYPOGRAPHY: TemplateTypography = {
  headingFont: "Inter", bodyFont: "Inter",
  headingWeight: "700", letterSpacing: "-0.02em",
};

export type SiteThemeInput = {
  color_overrides?: Partial<TemplatePalette> | null;
  design_overrides?: SiteDesign | null;
};

export type SiteTheme = {
  css: string;
  customCss: string | null;
  templateSlug: string | null;
};

/** Pure: build theme CSS from an already-fetched identity row + template. */
export function buildSiteTheme(
  identity: SiteThemeInput | null,
  template: ResolvedIdentity | null,
  scopeSelector = ":root",
): SiteTheme {
  const palette = { ...(template?.palette ?? SITE_FALLBACK_PALETTE), ...(identity?.color_overrides ?? {}) };
  return {
    css: buildTemplateCSSVars(
      palette,
      template?.typography ?? SITE_FALLBACK_TYPOGRAPHY,
      scopeSelector,
      identity?.design_overrides ?? null,
    ),
    customCss: template?.customCss ?? null,
    templateSlug: template?.slug ?? null,
  };
}

/** Fetch + build for a tenant. */
export async function resolveSiteTheme(tenantId: string, scopeSelector = ":root"): Promise<SiteTheme> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("site_identity")
    .select("template_id, color_overrides, design_overrides")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const template = data?.template_id ? await resolveDbTemplateIdentity(data.template_id) : null;
  return buildSiteTheme(data as SiteThemeInput | null, template, scopeSelector);
}
