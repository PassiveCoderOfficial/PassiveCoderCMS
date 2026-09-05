import { blockRegistry } from "@/modules/page-builder/block-registry";
import { BLOCK_VARIANTS, VARIANT_DATA_FIELD } from "@/modules/page-builder/block-variants";
import { generateId } from "@/lib/utils";
import type { Block } from "@/types/cms";
import type {
  SupportedBlockType, HeroContent, TextContent, ServicesContent,
  CtaContent, TestimonialsContent, FaqContent, FeaturesContent,
  StatsContent, IconGridContent, StepsContent, GalleryContent,
  TeamContent, PricingContent, ContactContent, NavigationContent,
  FooterContent, TimelineContent,
} from "./schemas";
import { findStockImage, findStockImages } from "./images";

/**
 * Merges AI-generated CONTENT into a real block-registry default. Every
 * layout/style/spacing field comes from the registry's create() — the model
 * never touches those, so it cannot emit a malformed BlockBase. Only the
 * fields explicitly assigned below come from AI output.
 *
 * The one visual decision the model is allowed is `variantKey`, and even that
 * is not free-form: it must match an entry in the BLOCK_VARIANTS manifest for
 * this block type or it is ignored. See applyVariant.
 */
export function mergeContentIntoBlock(
  type: SupportedBlockType,
  content: unknown,
  variantKey?: string,
): Block {
  const def = blockRegistry.find(b => b.type === type);
  if (!def) throw new Error(`No block-registry entry for type "${type}"`);
  const block = def.create();

  const merged = applyContent(type, content, block);
  applyVariant(merged, variantKey);
  return merged;
}

/**
 * Applies a model-chosen layout variant, but only if it is a real one.
 *
 * Blocks use one of two mechanisms (see block-variants.ts): most read
 * `templateVariant`, while some read a field inside `data` (nav reads
 * `data.style`, contact reads `data.layout`, …). VARIANT_DATA_FIELD says which.
 * An unknown key is dropped rather than written through — a typo'd variant
 * would otherwise silently fall back to the legacy layout with no signal, and
 * writing arbitrary model output into a data field is exactly the blast radius
 * this whole design exists to prevent.
 */
function applyVariant(block: Block, variantKey?: string): void {
  if (!variantKey) return;
  const allowed = BLOCK_VARIANTS[block.type];
  if (!allowed?.some(v => v.key === variantKey)) return;

  const dataField = VARIANT_DATA_FIELD[block.type];
  if (dataField) {
    (block as { data: Record<string, unknown> }).data[dataField] = variantKey;
  } else {
    block.templateVariant = variantKey;
  }
}

function applyContent(type: SupportedBlockType, content: unknown, block: Block): Block {
  switch (type) {
    case "hero": {
      const c = content as HeroContent;
      const b = block as Extract<Block, { type: "hero" }>;
      b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      if (c.badge) b.data.badge = c.badge;
      // description is optional in the schema, and the block registry seeds it
      // with instructional copy for a human filling the block in by hand ("Add
      // a compelling description that explains what you offer..."). Leaving
      // that default when the model omits the field publishes the instruction
      // to the customer's live site, which a test signup did. An empty string
      // renders as nothing, which is what an omission actually means.
      b.data.description = c.description ?? "";
      if (c.primaryButtonLabel && b.data.primaryButton) b.data.primaryButton.label = c.primaryButtonLabel;
      if (c.secondaryButtonLabel && b.data.secondaryButton) b.data.secondaryButton.label = c.secondaryButtonLabel;
      return b;
    }
    case "text": {
      const c = content as TextContent;
      const b = block as Extract<Block, { type: "text" }>;
      // Model only ever supplies plain paragraph strings, never HTML — this
      // is the one place AiCoder output becomes markup, and it's a fixed,
      // safe wrapper the model has no ability to influence or escape.
      b.data.content = c.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
      return b;
    }
    case "services": {
      const c = content as ServicesContent;
      const b = block as Extract<Block, { type: "services" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.items = c.items.map((item, i) => ({
        id: generateId(),
        // The model's pick when it made one — it is constrained to real lucide
        // names by the schema. Falling back to cycling the registry defaults
        // visibly repeats icons once a grid has more items than the three
        // defaults, which is most real service lists.
        icon: item.icon ?? b.data.items[i % b.data.items.length]?.icon ?? "Star",
        iconType: "lucide" as const,
        title: item.title,
        description: item.description,
      }));
      return b;
    }
    case "cta": {
      const c = content as CtaContent;
      const b = block as Extract<Block, { type: "cta" }>;
      b.data.title = c.title;
      if (c.description) b.data.description = c.description;
      if (c.primaryButtonLabel && b.data.primaryButton) b.data.primaryButton.label = c.primaryButtonLabel;
      if (c.secondaryButtonLabel && b.data.secondaryButton) b.data.secondaryButton.label = c.secondaryButtonLabel;
      return b;
    }
    case "testimonials": {
      const c = content as TestimonialsContent;
      const b = block as Extract<Block, { type: "testimonials" }>;
      if (c.title) b.data.title = c.title;
      b.data.items = c.items.map(item => ({
        id: generateId(),
        name: item.name,
        role: item.role ?? undefined,
        content: item.content,
        rating: 5,
      }));
      return b;
    }
    case "faq": {
      const c = content as FaqContent;
      const b = block as Extract<Block, { type: "faq" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.items = c.items.map(item => ({
        id: generateId(),
        question: item.question,
        answer: item.answer,
      }));
      return b;
    }
    case "features": {
      const c = content as FeaturesContent;
      const b = block as Extract<Block, { type: "features" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.items = c.items.map((item, i) => ({
        id: generateId(),
        icon: item.icon ?? b.data.items[i % b.data.items.length]?.icon ?? "Star",
        title: item.title,
        description: item.description,
      }));
      return b;
    }
    case "stats": {
      const c = content as StatsContent;
      const b = block as Extract<Block, { type: "stats" }>;
      if (c.title) b.data.title = c.title;
      b.data.items = c.items.map(item => ({
        id: generateId(),
        value: item.value,
        label: item.label,
        suffix: item.suffix ?? undefined,
      }));
      return b;
    }
    case "icon_grid": {
      const c = content as IconGridContent;
      const b = block as Extract<Block, { type: "icon_grid" }>;
      if (c.title) b.data.title = c.title;
      b.data.items = c.items.map((item, i) => ({
        id: generateId(),
        icon: item.icon ?? b.data.items[i % b.data.items.length]?.icon ?? "Star",
        label: item.label,
      }));
      return b;
    }
    case "steps": {
      const c = content as StepsContent;
      const b = block as Extract<Block, { type: "steps" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.items = c.items.map(item => ({
        id: generateId(),
        title: item.title,
        description: item.description,
      }));
      return b;
    }
    case "gallery": {
      const c = content as GalleryContent;
      const b = block as Extract<Block, { type: "gallery" }>;
      if (c.title) b.data.title = c.title;
      // Slots are created empty here and filled by resolveBlockImages, which
      // runs separately so a slow image provider can't block the copy. An
      // empty `url` renders the builder's own placeholder tile, which is the
      // correct fallback when image lookup is unavailable or fails. Leaves the owner a
      // correctly-sized set of slots to drop real photos into.
      b.data.images = c.captions.map(caption => ({
        id: generateId(),
        url: "",
        alt: caption,
        caption,
      }));
      return b;
    }
    case "team": {
      const c = content as TeamContent;
      const b = block as Extract<Block, { type: "team" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.members = c.members.map(m => ({
        id: generateId(),
        name: m.name,
        role: m.role,
        bio: m.bio ?? undefined,
      }));
      return b;
    }
    case "pricing": {
      const c = content as PricingContent;
      const b = block as Extract<Block, { type: "pricing" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.plans = c.plans.map(p => ({
        id: generateId(),
        name: p.name,
        price: p.price,
        period: p.period ?? undefined,
        description: p.description ?? undefined,
        features: p.features,
        highlighted: p.highlighted ?? undefined,
        ctaLabel: p.ctaLabel ?? "Get Started",
        ctaUrl: "#",
      }));
      return b;
    }
    case "contact": {
      const c = content as ContactContent;
      const b = block as Extract<Block, { type: "contact" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      if (c.submitLabel) b.data.submitLabel = c.submitLabel;
      if (c.successMessage) b.data.successMessage = c.successMessage;
      b.data.fields = c.fields.map(f => ({
        id: generateId(),
        label: f.label,
        type: f.type,
        required: f.required ?? false,
      }));
      return b;
    }
    case "navigation": {
      const c = content as NavigationContent;
      const b = block as Extract<Block, { type: "navigation" }>;
      b.data.logoText = c.logoText;
      b.data.items = c.links.map(l => ({
        id: generateId(),
        label: l.label,
        url: sanitizeInternalUrl(l.url),
      }));
      if (c.ctaLabel) {
        b.data.showCta = true;
        b.data.ctaLabel = c.ctaLabel;
      }
      return b;
    }
    case "footer": {
      const c = content as FooterContent;
      const b = block as Extract<Block, { type: "footer" }>;
      b.data.logoText = c.logoText;
      if (c.tagline) b.data.tagline = c.tagline;
      b.data.columns = c.columns.map(col => ({
        id: generateId(),
        heading: col.heading,
        links: col.links.map(l => ({
          id: generateId(),
          label: l.label,
          url: sanitizeInternalUrl(l.url),
        })),
      }));
      return b;
    }
    case "timeline": {
      const c = content as TimelineContent;
      const b = block as Extract<Block, { type: "timeline" }>;
      if (c.title) b.data.title = c.title;
      b.data.items = c.items.map(item => ({
        id: generateId(),
        date: item.date ?? "",
        title: item.title,
        description: item.description,
      }));
      return b;
    }
  }
}

/**
 * Forces a model-written link to a same-site relative path.
 *
 * Nav and footer are the only blocks where AiCoder produces URLs, and an
 * off-site or `javascript:` destination in a site's own navigation would be a
 * genuine injection vector — so nothing but a relative path survives. Anything
 * absolute, protocol-relative or scheme-bearing is reduced to its final path
 * segment, and a fragment link is left alone.
 */
function sanitizeInternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "/";
  if (trimmed.startsWith("#")) return trimmed;

  // Any scheme (http:, javascript:, data:) or protocol-relative prefix — keep
  // only the path portion, never the host.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || trimmed.startsWith("//")) {
    const path = trimmed.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, "").replace(/^\/*/, "");
    const firstSlash = path.indexOf("/");
    return firstSlash === -1 ? "/" : normalizePath(path.slice(firstSlash));
  }
  return normalizePath(trimmed);
}

function normalizePath(path: string): string {
  const cleaned = path.replace(/[^a-zA-Z0-9/_#?=&.-]/g, "");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Resolves the model's image search phrases into real photo URLs, in place.
 *
 * Separate from mergeContentIntoBlock, and deliberately so: merging is pure and
 * synchronous, while this reaches out to a third-party API. Keeping them apart
 * means a slow or failing image provider can never corrupt or block the copy
 * the tenant already paid a generation for — on any failure the block simply
 * keeps its empty image slots, exactly as before this existed.
 *
 * Returns whether every image it fetched was subject-relevant, so the UI can
 * tell the user when they are looking at neutral placeholders that need
 * replacing rather than photos of their actual trade.
 */
export async function resolveBlockImages(
  block: Block,
  content: unknown,
): Promise<{ usedPlaceholders: boolean }> {
  let usedPlaceholders = false;

  try {
    if (block.type === "hero") {
      const query = (content as { imageQuery?: string }).imageQuery;
      if (query) {
        const image = await findStockImage(query, "landscape");
        if (image) {
          const b = block as Extract<Block, { type: "hero" }>;
          b.data.imageUrl = image.url;
          b.data.imageAlt = image.alt;
          if (!image.relevant) usedPlaceholders = true;
        }
      }
    } else if (block.type === "gallery") {
      const c = content as { captions?: string[]; imageQueries?: string[] };
      const captions = c.captions ?? [];
      if (captions.length) {
        // Fall back to the caption when the model didn't supply a matching
        // query — a caption like "Rewiring a shophouse unit" is already a
        // serviceable search phrase.
        const images = await findStockImages(
          captions.map((caption, i) => ({
            query: c.imageQueries?.[i] ?? caption,
            orientation: "landscape" as const,
          })),
        );
        const b = block as Extract<Block, { type: "gallery" }>;
        b.data.images = captions.map((caption, i) => ({
          id: generateId(),
          url: images[i]?.url ?? "",
          alt: images[i]?.alt ?? caption,
          caption,
        }));
        if (images.some(img => img && !img.relevant)) usedPlaceholders = true;
      }
    }
  } catch {
    // Imagery is decorative. Losing it costs nothing that was paid for; losing
    // the block would.
  }

  return { usedPlaceholders };
}
