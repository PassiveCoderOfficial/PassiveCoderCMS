/**
 * DB-backed template engine types (Ticket 5).
 *
 * A "site template" is a full site bundle — N pages + nav + footer +
 * palette/typography — authored visually in the normal page builder by an
 * SA or Staff Admin, then applied to a tenant as a one-time copy.
 *
 * This is the replacement for the hand-coded `TemplateIdentity` objects in
 * `template-registry.ts`. It deliberately reuses that file's `TemplatePalette`
 * and `TemplateTypography` types so the CSS-var pipeline
 * (`buildTemplateCSSVars`) works against both without a translation layer
 * while the two systems coexist through Phase 3.
 */
import type { TemplatePalette, TemplateTypography } from "@/modules/themes/template-registry";
import type { Block, NavItem } from "@/types/cms";

export type TemplateStatus = "draft" | "published" | "archived";
export type TemplateCategoryStatus = "active" | "pending";

export type TemplateCategory = {
  id: string;
  name: string;
  slug: string;
  status: TemplateCategoryStatus;
  sort_order: number;
  requested_by: string | null;
  created_at: string;
};

/**
 * One row of `templates`. Nullable identity fields are the ones added in
 * migration 054 — the 54 pre-existing catalog rows (still served by the old
 * registry path until Phase 3) have them unset, so every consumer must treat
 * them as optional rather than assuming a fully-authored template.
 */
export type SiteTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Legacy free-text category from the original catalog table. */
  category: string;
  /** FK to the managed category list — preferred over `category` going forward. */
  category_id: string | null;
  tags: string[];
  owner_id: string | null;
  status: TemplateStatus;
  active: boolean;
  featured: boolean;

  palette: TemplatePalette | null;
  typography: TemplateTypography | null;
  custom_css: string | null;
  logo_url: string | null;
  favicon_url: string | null;

  global_header: Block[] | null;
  global_footer: Block[] | null;
  nav_items: NavItem[] | null;

  screenshot_url: string | null;
  /** Set when the template was snapshotted from a real tenant site. */
  source_tenant_id: string | null;

  created_at: string;
  updated_at: string;
};

/** A template's page, as stored in `pages` with `template_id` set. */
export type TemplatePage = {
  id: string;
  template_id: string;
  title: string;
  slug: string;
  status: string;
  blocks: Block[];
  order_index: number;
  created_at: string;
  updated_at: string;
};

/** Payload for creating a template, from either creation path. */
export type CreateTemplateInput = {
  name: string;
  slug: string;
  description?: string;
  categoryId?: string | null;
  /** Staff can request a category that doesn't exist yet; SA approves later. */
  requestedCategoryName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  /** Set to snapshot an existing tenant's site into the new template. */
  sourceTenantId?: string | null;
};
