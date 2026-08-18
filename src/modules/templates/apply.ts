/**
 * Apply a DB-backed template to a tenant.
 *
 * This is the counterpart to `snapshot.ts`, and replaced
 * `lib/templates/seed-template.ts`, which built sites from the hardcoded
 * TEMPLATE_REGISTRY. Callers with a slug rather than an id go through
 * `apply-by-slug.ts`.
 *
 * Copy-on-apply, always: the tenant gets its own copies of the template's
 * pages. Later edits to the template never reach tenants that already applied
 * it, and a tenant editing its pages never affects the template.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block, NavItem } from "@/types/cms";
import type { TemplatePalette, TemplateTypography } from "@/modules/themes/template-types";
import { resolveNavItems } from "@/modules/navigation/resolve-links";

export type ApplyMode = "theme" | "full";

export type ApplyOptions = {
  /** Archive the tenant's current pages instead of leaving them alongside. */
  archiveExistingPages?: boolean;
};

export type ApplyResult = {
  pagesCreated: number;
  pagesArchived: number;
};

type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  palette: TemplatePalette | null;
  typography: TemplateTypography | null;
  custom_css: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  global_header: Block[] | null;
  global_footer: Block[] | null;
  nav_items: NavItem[] | null;
};

/**
 * Applies `templateId` to `tenantId`.
 *
 * "theme" mode replaces the site's visual identity only — colours, fonts,
 * nav, header/footer — leaving existing pages untouched. "full" additionally
 * copies the template's pages in.
 *
 * Deliberately preserved on the tenant (never overwritten by a template):
 * site_name, contact details, and anything outside site_identity's visual
 * columns. Those are the tenant's own business facts, not template design.
 */
export async function applyDbTemplate(
  supabase: SupabaseClient,
  tenantId: string,
  templateId: string,
  mode: ApplyMode,
  options: ApplyOptions = {},
): Promise<ApplyResult> {
  const { data: template } = await supabase
    .from("templates")
    .select("id, slug, name, palette, typography, custom_css, logo_url, favicon_url, global_header, global_footer, nav_items")
    .eq("id", templateId)
    .maybeSingle();

  if (!template) throw new Error("Template not found");
  const tpl = template as TemplateRow;

  // ── 1. Visual identity ──────────────────────────────────────────────────
  // template_id is what (site)/layout.tsx resolves the palette from, so
  // pointing it at this template is the whole of "apply the theme".
  //
  // This used to copy the template's palette into `color_overrides` instead,
  // because the live CSS-var pipeline only understood registry slugs. That
  // field holds the tenant's *own* manual colour tweaks, so writing to it
  // both clobbered their customisations and made later edits to the template
  // unable to take effect. Overrides are left alone now and continue to layer
  // on top of the template palette, which is what they were always for.
  const identityPatch: Record<string, unknown> = {
    tenant_id: tenantId,
    template_id: tpl.id,
    active_template_slug: tpl.slug,
    updated_at: new Date().toISOString(),
  };
  if (tpl.palette) {
    identityPatch.primary_color = tpl.palette.primary;
    identityPatch.secondary_color = tpl.palette.secondary;
  }
  if (tpl.logo_url) identityPatch.logo_url = tpl.logo_url;
  if (tpl.favicon_url) identityPatch.favicon_url = tpl.favicon_url;
  if (tpl.global_header) identityPatch.global_header = tpl.global_header;
  if (tpl.global_footer) identityPatch.global_footer = tpl.global_footer;

  const { error: identityError } = await supabase
    .from("site_identity")
    .upsert(identityPatch, { onConflict: "tenant_id" });
  // Previously ignored — a failed write here left the tenant on its old theme
  // while the UI reported success.
  if (identityError) throw new Error(`Failed to apply theme: ${identityError.message}`);

  // ── 2. Navigation ───────────────────────────────────────────────────────
  // Templates authored as one-page designs carry "#services"-style fragment
  // links. Applied to a tenant that gets real pages, those go nowhere from
  // any page but home — resolve them against the slugs this template actually
  // ships before the menu is written.
  if (tpl.nav_items?.length) {
    const { data: navPages } = await supabase
      .from("pages")
      .select("slug")
      .eq("template_id", templateId)
      .is("deleted_at", null);
    const templateSlugs = (navPages ?? []).map((p) => p.slug as string);

    await supabase.from("nav_menus").upsert(
      {
        tenant_id: tenantId,
        name: "Main Navigation",
        location: "header",
        items: resolveNavItems(tpl.nav_items, templateSlugs),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,location" },
    );
  }

  await supabase.from("tenant_template_imports").insert({
    tenant_id: tenantId,
    template_id: tpl.id,
    template_slug: tpl.slug,
    mode,
    applied_at: new Date().toISOString(),
  });

  if (mode === "theme") {
    return { pagesCreated: 0, pagesArchived: 0 };
  }

  // ── 3. Pages (full mode) ────────────────────────────────────────────────
  // Archiving is soft and reversible by design — a template apply must never
  // be the thing that destroys a customer's existing content.
  let pagesArchived = 0;
  // Ids of rows this apply archived, so they can be put back if the insert
  // below fails — otherwise a failure leaves the site with nothing live.
  const archivedByThisApply: string[] = [];
  if (options.archiveExistingPages) {
    const { data: archived } = await supabase
      .from("pages")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("status", "archived")
      .select("id");
    pagesArchived = archived?.length ?? 0;
    archivedByThisApply.push(...(archived ?? []).map((r) => r.id as string));
  }

  const { data: templatePages } = await supabase
    .from("pages")
    .select("title, slug, type, blocks, seo, settings, order_index, featured_image, excerpt")
    .eq("template_id", templateId)
    .is("deleted_at", null)
    .order("order_index", { ascending: true });

  const pages = templatePages ?? [];
  if (pages.length === 0) return { pagesCreated: 0, pagesArchived };

  // A tenant can't have two live pages on the same slug. Anything colliding
  // with an incoming template page is archived rather than overwritten, so
  // the old version stays recoverable.
  const incomingSlugs = pages.map((p) => p.slug as string);
  const { data: collisions } = await supabase
    .from("pages")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .in("slug", incomingSlugs)
    .is("deleted_at", null)
    .neq("status", "archived")
    .select("id");
  pagesArchived += collisions?.length ?? 0;
  archivedByThisApply.push(...(collisions ?? []).map((r) => r.id as string));

  // Same fragment problem as the menu above, but for nav blocks embedded in
  // the pages themselves — which is where every migrated template keeps its
  // navigation.
  const pageSlugs = pages.map((p) => p.slug as string);
  const resolveBlockNav = (blocks: Block[]): Block[] =>
    blocks.map((b) => {
      if (b.type !== "navigation") return b;
      const data = b.data as { items?: NavItem[] };
      if (!Array.isArray(data.items)) return b;
      return { ...b, data: { ...data, items: resolveNavItems(data.items, pageSlugs) } } as Block;
    });

  const now = new Date().toISOString();
  const rows = pages.map((p, i) => ({
    tenant_id: tenantId,
    template_id: null,
    title: p.title,
    slug: p.slug,
    type: p.type ?? "page",
    status: "published",
    blocks: resolveBlockNav((p.blocks as Block[] | null) ?? []),
    seo: p.seo ?? {},
    settings: p.settings ?? {},
    featured_image: p.featured_image ?? null,
    excerpt: p.excerpt ?? null,
    order_index: p.order_index ?? i,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase.from("pages").insert(rows);
  if (error) {
    // The archive above already ran. Leaving it as-is would strand the site
    // with every page archived and nothing live, which is what happened to
    // freebirdsg — so put the tenant's own pages back before reporting.
    if (archivedByThisApply.length) {
      await supabase
        .from("pages")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .in("id", archivedByThisApply);
    }
    throw new Error(`Failed to copy template pages: ${error.message}`);
  }

  return { pagesCreated: rows.length, pagesArchived };
}

/** True when `slug` resolves to a DB-authored template rather than a registry one. */
export async function isDbTemplate(supabase: SupabaseClient, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from("templates")
    .select("id")
    .eq("slug", slug)
    .not("owner_id", "is", null)
    .maybeSingle();
  return data?.id ?? null;
}
