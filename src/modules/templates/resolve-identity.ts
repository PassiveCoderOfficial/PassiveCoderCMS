/**
 * Resolves a tenant's `site_identity.template_id` into the palette/typography/
 * customCss shape `(site)/layout.tsx` renders from — the DB-template
 * replacement for `getTemplateIdentity()` in the old registry.
 *
 * Deliberately returns the same `{ slug, palette, typography, customCss }`
 * shape the registry's `TemplateIdentity` exposes (a subset of its fields) so
 * the call site doesn't need to branch on where the identity came from.
 */
import { createAdminClient } from "@/lib/supabase/server";
import type { TemplatePalette, TemplateTypography } from "@/modules/themes/template-registry";

export type ResolvedIdentity = {
  slug: string;
  palette: TemplatePalette;
  typography: TemplateTypography;
  customCss?: string;
};

export async function resolveDbTemplateIdentity(templateId: string): Promise<ResolvedIdentity | null> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("templates")
    .select("slug, palette, typography, custom_css")
    .eq("id", templateId)
    .maybeSingle();

  if (!data?.palette || !data?.typography) return null;

  return {
    slug: data.slug,
    palette: data.palette as TemplatePalette,
    typography: data.typography as TemplateTypography,
    customCss: (data.custom_css as string | null) ?? undefined,
  };
}
