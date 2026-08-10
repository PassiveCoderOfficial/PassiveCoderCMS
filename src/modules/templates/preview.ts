/**
 * Resolves a template slug — from either source — into everything the public
 * preview page needs to render it.
 *
 * Registry templates generate their blocks on the fly via
 * `buildHomePageBlocks()`. DB templates have real authored pages, so their
 * home page's stored blocks are used directly. Both come back in one shape so
 * the preview route doesn't branch on source.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTemplateIdentity } from "@/modules/themes/template-registry";
import type { TemplatePalette, TemplateTypography } from "@/modules/themes/template-registry";
import { buildHomePageBlocks } from "@/lib/templates/seed-template";
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
  source: "db" | "registry";
  /** Other pages in this template, for the preview page-switcher. */
  pages: { slug: string; title: string }[];
};

const FALLBACK_PALETTE: TemplatePalette = {
  primary: "#4f46e5",
  primaryFg: "#ffffff",
  secondary: "#1e293b",
  accent: "#818cf8",
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#f1f5f9",
  mutedFg: "#64748b",
  card: "#ffffff",
  border: "#e2e8f0",
  ring: "#4f46e5",
  borderRadius: "0.5rem",
};

const FALLBACK_TYPOGRAPHY: TemplateTypography = {
  headingFont: "Inter",
  bodyFont: "Inter",
  headingWeight: "700",
  letterSpacing: "-0.01em",
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
  // DB templates take precedence: if someone authored one that shadows a
  // registry slug, the authored version is the live one.
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
      palette: (dbTemplate.palette as TemplatePalette | null) ?? FALLBACK_PALETTE,
      typography: (dbTemplate.typography as TemplateTypography | null) ?? FALLBACK_TYPOGRAPHY,
      customCss: (dbTemplate.custom_css as string | null) ?? null,
      blocks: composed,
      source: "db",
      pages: allPages.map((p) => ({ slug: p.slug as string, title: p.title as string })),
    };
  }

  const identity = getTemplateIdentity(slug);
  if (!identity) return null;

  return {
    slug: identity.slug,
    name: identity.name,
    description: identity.description,
    category: identity.category,
    palette: identity.palette,
    typography: identity.typography,
    customCss: identity.customCss ?? null,
    blocks: buildHomePageBlocks(identity),
    source: "registry",
    // Registry templates are generated as a single home page in this preview.
    pages: [{ slug: "home", title: "Home" }],
  };
}
