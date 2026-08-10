/**
 * Applies a template to a tenant given a *slug* rather than an id.
 *
 * Site creation (onboarding, staff, super admin) and the dashboard's apply
 * button all know a slug, not a template id — this is the one place that
 * resolves it and decides what happens when it doesn't resolve. Replaces
 * `seedTemplate()`, which generated sites from the hardcoded TEMPLATE_REGISTRY.
 *
 * "blank" or an unknown slug seeds the minimal starter site rather than
 * failing, so a new tenant is never left with zero pages.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyDbTemplate, isDbTemplate, type ApplyMode, type ApplyResult } from "./apply";
import { seedStarterSite } from "./starter-site";

export async function applyTemplateBySlug(
  supabase: SupabaseClient,
  tenantId: string,
  slug: string | null | undefined,
  mode: ApplyMode,
  options: { archiveExistingPages?: boolean; siteName?: string } = {},
): Promise<ApplyResult & { source: "db" | "starter" }> {
  const templateId = slug && slug !== "blank" ? await isDbTemplate(supabase, slug) : null;

  if (!templateId) {
    if (slug && slug !== "blank") {
      console.warn(`[applyTemplateBySlug] unknown template slug "${slug}" — seeding starter site instead`);
    }
    // Theme-only mode has no pages to create, so there's nothing to seed.
    if (mode === "full") {
      await seedStarterSite(supabase, tenantId, options.siteName ?? "Your Site");
    }
    return { pagesCreated: 0, pagesArchived: 0, source: "starter" };
  }

  const result = await applyDbTemplate(supabase, tenantId, templateId, mode, {
    archiveExistingPages: options.archiveExistingPages ?? false,
  });
  return { ...result, source: "db" };
}
