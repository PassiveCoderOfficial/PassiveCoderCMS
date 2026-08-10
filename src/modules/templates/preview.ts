/**
 * Resolves a published template slug into everything the public preview page
 * needs to render it: its authored pages' stored blocks, plus the palette and
 * typography to render them under.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TemplatePalette, TemplateTypography } from "@/modules/themes/template-types";
import { DEFAULT_PALETTE, DEFAULT_TYPOGRAPHY } from "@/modules/themes/default-palette";
import type { Block } from "@/types/cms";

export type ResolvedPreviewTemplate = {
  slug: string;
  name: string;
  description: string;
  category: string;
  palette: TemplatePalette;
  typography: TemplateTypography;
  customCss: string | null;
  blocks: Block[];
  source: "db";
  /** Other pages in this template, for the preview page-switcher. */
  pages: { slug: string; title: string }[];
};

/**
 * @param pageSlug which page of the template to render; defaults to its home
 *   page (or the first page, for templates that don't have one named "home").
 */
export async function resolvePreviewTemplate(
  supabase: SupabaseClient,
  slug: string,
  pageSlug?: string,
): Promise<ResolvedPreviewTemplate | null> {
  const { data: dbTemplate } = await supabase
    .from("templates")
    .select("id, slug, name, description, category, palette, typography, custom_css, global_header, global_footer, status, owner_id")
    .eq("slug", slug)
    .not("owner_id", "is", null)
    .eq("status", "published")
    .maybeSingle();

  if (dbTemplate) {
    const { data: pages } = await supabase
      .from("pages")
      .select("slug, title, blocks, order_index")
      .eq("template_id", dbTemplate.id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });

    const allPages = pages ?? [];
    const target =
      (pageSlug ? allPages.find((p) => p.slug === pageSlug) : null) ??
      allPages.find((p) => p.slug === "home") ??
      allPages[0];

    // A template with no pages yet still previews — as its bare chrome —
    // rather than 404ing, which would look broken to whoever just authored it.
    const header = (dbTemplate.global_header as Block[] | null) ?? [];
    const footer = (dbTemplate.global_footer as Block[] | null) ?? [];
    const body = (target?.blocks as Block[] | null) ?? [];

    // Header, body and footer are authored separately, so each numbers its
    // blocks from 0. The renderer sorts by `order`, which would interleave
    // them — a one-block footer (order 0) sorting up next to the hero. Flatten
    // to one sequence so concatenation order is what actually renders.
    const composed = [...header, ...body, ...footer].map((b, i) => ({ ...b, order: i }));

    return {
      slug: dbTemplate.slug,
      name: dbTemplate.name,
      description: dbTemplate.description ?? "",
      category: dbTemplate.category ?? "",
      palette: (dbTemplate.palette as TemplatePalette | null) ?? DEFAULT_PALETTE,
      typography: (dbTemplate.typography as TemplateTypography | null) ?? DEFAULT_TYPOGRAPHY,
      customCss: (dbTemplate.custom_css as string | null) ?? null,
      blocks: composed,
      source: "db",
      pages: allPages.map((p) => ({ slug: p.slug as string, title: p.title as string })),
    };
  }

  return null;
}
