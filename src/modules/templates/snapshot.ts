/**
 * "Save as Template" — snapshot a live tenant site into a reusable template.
 *
 * Copies the tenant's resolved visual identity (palette/typography/nav/
 * header/footer) onto a `templates` row, and clones every non-archived page
 * into `pages` rows owned by that template (`template_id` set, `tenant_id`
 * null). Copy-on-write throughout: the source tenant is never mutated, and
 * later edits to the template never flow back to it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTemplateIdentity } from "@/modules/themes/template-registry";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import type { TemplatePalette, TemplateTypography } from "@/modules/themes/template-registry";
import type { Block, NavItem } from "@/types/cms";

/**
 * Resolve a tenant's *effective* palette the same way the live site does:
 * the active template's palette with the tenant's own colour overrides
 * layered on top (see `(site)/layout.tsx`). Without this merge a snapshot
 * would capture the stock template colours and silently drop whatever the
 * tenant actually customised.
 *
 * `templateId` (site_identity.template_id, the DB templates row) is checked
 * first; `activeTemplateSlug` + the registry is a fallback for any tenant not
 * yet repointed. Once every tenant carries template_id and the registry is
 * deleted, the fallback branch becomes dead and can go with it.
 */
export async function resolveTenantPalette(
  templateId: string | null | undefined,
  activeTemplateSlug: string | null | undefined,
  colorOverrides: Partial<TemplatePalette> | null | undefined,
): Promise<{ palette: TemplatePalette | null; typography: TemplateTypography | null; customCss: string | null }> {
  const identity = templateId
    ? await resolveDbTemplateIdentity(templateId)
    : activeTemplateSlug
      ? getTemplateIdentity(activeTemplateSlug)
      : null;
  if (!identity) {
    return { palette: null, typography: null, customCss: null };
  }
  return {
    palette: { ...identity.palette, ...(colorOverrides ?? {}) },
    typography: identity.typography,
    customCss: identity.customCss ?? null,
  };
}

export type SnapshotResult = {
  templateId: string;
  pagesCopied: number;
};

/**
 * Clone `sourceTenantId`'s site into the already-created template row
 * `templateId`. Assumes the caller has verified permissions and created the
 * template row (so slug/name/category validation lives in one place, the
 * API route, rather than being duplicated here).
 */
export async function snapshotTenantIntoTemplate(
  supabase: SupabaseClient,
  sourceTenantId: string,
  templateId: string,
): Promise<SnapshotResult> {
  // ── Identity ────────────────────────────────────────────────────────────
  const [{ data: identity }, { data: navMenu }] = await Promise.all([
    supabase
      .from("site_identity")
      .select("active_template_slug, template_id, color_overrides, logo_url, favicon_url, global_header, global_footer")
      .eq("tenant_id", sourceTenantId)
      .maybeSingle(),
    supabase
      .from("nav_menus")
      .select("items")
      .eq("tenant_id", sourceTenantId)
      .eq("location", "header")
      .maybeSingle(),
  ]);

  const { palette, typography, customCss } = await resolveTenantPalette(
    identity?.template_id as string | null,
    identity?.active_template_slug as string | null,
    identity?.color_overrides as Partial<TemplatePalette> | null,
  );

  await supabase
    .from("templates")
    .update({
      palette,
      typography,
      custom_css: customCss,
      logo_url: (identity?.logo_url as string | null) ?? null,
      favicon_url: (identity?.favicon_url as string | null) ?? null,
      global_header: (identity?.global_header as Block[] | null) ?? null,
      global_footer: (identity?.global_footer as Block[] | null) ?? null,
      nav_items: (navMenu?.items as NavItem[] | null) ?? null,
      source_tenant_id: sourceTenantId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId);

  // ── Pages ───────────────────────────────────────────────────────────────
  // Archived and soft-deleted pages are skipped — a template should capture
  // the site as it currently stands, not its history.
  const { data: sourcePages } = await supabase
    .from("pages")
    .select("title, slug, type, blocks, seo, settings, order_index, featured_image, excerpt")
    .eq("tenant_id", sourceTenantId)
    .is("deleted_at", null)
    .neq("status", "archived")
    .order("order_index", { ascending: true });

  const pages = sourcePages ?? [];
  if (pages.length > 0) {
    const now = new Date().toISOString();
    const rows = pages.map((p, i) => ({
      template_id: templateId,
      tenant_id: null,
      title: p.title,
      slug: p.slug,
      type: p.type ?? "page",
      // Template pages are always 'published' within the template's own
      // world — the template row's own status controls whether the template
      // is visible, so a draft page here would just be invisible dead weight.
      status: "published",
      blocks: p.blocks ?? [],
      seo: p.seo ?? {},
      settings: p.settings ?? {},
      featured_image: p.featured_image ?? null,
      excerpt: p.excerpt ?? null,
      order_index: p.order_index ?? i,
      created_at: now,
      updated_at: now,
    }));
    await supabase.from("pages").insert(rows);
  }

  return { templateId, pagesCopied: pages.length };
}
