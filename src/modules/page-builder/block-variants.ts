/**
 * Block layout variants — the single source of truth for what a block can
 * look like.
 *
 * Variants were previously reachable only by a template setting
 * `block.templateVariant` at seed time; there was no way to choose one while
 * editing. This manifest backs the variant picker in the Config tab, so every
 * variant a block implements is selectable by hand.
 *
 * Each key here MUST match a string the block component dispatches on — see
 * e.g. `HeroBlock`'s `variant === "split-image-right"` chain. Adding an entry
 * without implementing it in the component silently falls back to the block's
 * legacy layout.
 *
 * `thumb` maps to a wireframe preview in `VariantThumbnail`; several variants
 * can share one thumb when their structure is the same and only the palette
 * treatment differs (e.g. the various coloured stat rows).
 */
import type { BlockType } from "@/types/cms";

export type VariantThumbKind =
  | "split-image" | "fullscreen" | "centered" | "gradient-left" | "corporate"
  | "cards-grid" | "cards-dark" | "list-rows" | "numbered-list" | "menu-list"
  | "quote-cards" | "quote-dark" | "quote-wide" | "quote-minimal"
  | "stat-row" | "stat-dark" | "stat-gradient"
  | "banner" | "banner-dark" | "split-cta"
  | "price-cards" | "price-dark" | "price-minimal"
  | "accordion" | "two-col"
  | "avatar-cards" | "avatar-list"
  | "grid-tight" | "masonry"
  | "steps-cards" | "steps-timeline"
  | "tiles" | "inline-icons"
  | "bento";

export type BlockVariant = {
  /** Value written to `block.templateVariant`. */
  key: string;
  label: string;
  /** One line on what makes this layout different. */
  description: string;
  thumb: VariantThumbKind;
  /** Reads better on dark palettes — surfaced as a hint in the picker. */
  dark?: boolean;
};

/**
 * `null` key = the block's built-in layout (no templateVariant set), which
 * every block falls back to. Listed first so "no variant" is always an option
 * rather than something you can select into but never out of.
 */
export const DEFAULT_VARIANT: BlockVariant = {
  key: "",
  label: "Default",
  description: "The block's standard layout, controlled by its own settings.",
  thumb: "cards-grid",
};

export const BLOCK_VARIANTS: Partial<Record<BlockType, BlockVariant[]>> = {
  hero: [
    { key: "split-image-right", label: "Split Image", description: "Text left, image right — the classic marketing hero.", thumb: "split-image" },
    { key: "fullscreen-overlay", label: "Fullscreen Overlay", description: "Full-bleed background image with text over a tinted overlay.", thumb: "fullscreen", dark: true },
    { key: "centered-bold", label: "Centered Bold", description: "Large centered headline, no image — strong and typographic.", thumb: "centered" },
    { key: "dark-gradient-left", label: "Dark Gradient", description: "Dark gradient panel on the left, imagery bleeding right.", thumb: "gradient-left", dark: true },
    { key: "corporate", label: "Corporate", description: "Restrained, structured layout with a formal tone.", thumb: "corporate" },
  ],

  services: [
    { key: "icon-cards-grid", label: "Icon Cards", description: "Icon-led cards in a grid — no photography needed.", thumb: "cards-grid" },
    { key: "dark-grid-cards", label: "Dark Cards", description: "Same grid on a dark surface with accent top borders.", thumb: "cards-dark", dark: true },
    { key: "image-cards-dark", label: "Image Cards (Dark)", description: "Photo-first cards on dark — good for trades and automotive.", thumb: "cards-dark", dark: true },
    { key: "bordered-list", label: "Bordered List", description: "Full-width rows separated by rules, easy to scan.", thumb: "list-rows" },
    { key: "numbered", label: "Numbered", description: "Sequentially numbered services — reads as a process.", thumb: "numbered-list" },
    { key: "menu-cards", label: "Menu Cards", description: "Compact price-led cards, styled like a menu.", thumb: "menu-list" },
    { key: "program-cards-dark", label: "Program Cards", description: "Bold dark cards for classes, programs or packages.", thumb: "cards-dark", dark: true },
  ],

  testimonials: [
    { key: "quote-cards", label: "Quote Cards", description: "Cards with an avatar, name and star rating.", thumb: "quote-cards" },
    { key: "dark-quote-cards", label: "Dark Quote Cards", description: "The same cards tuned for dark backgrounds.", thumb: "quote-dark", dark: true },
    { key: "full-width", label: "Full Width", description: "One large testimonial at a time, given real weight.", thumb: "quote-wide" },
    { key: "minimal-quote", label: "Minimal", description: "Just the words — no cards, no chrome.", thumb: "quote-minimal" },
    { key: "warm-cards", label: "Warm Cards", description: "Soft, rounded cards with a friendly tone.", thumb: "quote-cards" },
    { key: "formal-cards", label: "Formal Cards", description: "Sharper, more corporate presentation.", thumb: "quote-cards" },
    { key: "transformation-cards", label: "Transformation", description: "Before/after framing — fitness, beauty, renovation.", thumb: "quote-cards" },
  ],

  stats: [
    { key: "colored-row", label: "Coloured Row", description: "Stats in a tinted band using the brand primary.", thumb: "stat-row" },
    { key: "bold-dark-row", label: "Bold Dark", description: "Heavy numerals on a dark band.", thumb: "stat-dark", dark: true },
    { key: "dark-band", label: "Dark Band", description: "Understated dark strip, lighter weight than Bold Dark.", thumb: "stat-dark", dark: true },
    { key: "gradient-numbers", label: "Gradient Numbers", description: "Numbers filled with a brand gradient.", thumb: "stat-gradient" },
    { key: "navy-row", label: "Navy Row", description: "Deep navy band — corporate and trustworthy.", thumb: "stat-dark", dark: true },
    { key: "warm-row", label: "Warm Row", description: "Warm-tinted band for hospitality and lifestyle.", thumb: "stat-row" },
    { key: "plain-dark", label: "Plain Dark", description: "Minimal dark row, no surface fill.", thumb: "stat-dark", dark: true },
  ],

  pricing: [
    { key: "highlighted-cards", label: "Highlighted Cards", description: "Three tiers with the recommended one lifted.", thumb: "price-cards" },
    { key: "dark-cards", label: "Dark Cards", description: "Tier cards on a dark surface.", thumb: "price-dark", dark: true },
    { key: "dark", label: "Dark Table", description: "Dense dark comparison layout.", thumb: "price-dark", dark: true },
    { key: "minimal-dark", label: "Minimal Dark", description: "Stripped-back dark pricing, typography-led.", thumb: "price-minimal", dark: true },
    { key: "membership-cards", label: "Membership", description: "Recurring-plan framing for gyms and clubs.", thumb: "price-cards" },
    { key: "menu-pricing", label: "Menu Pricing", description: "Itemised price list, restaurant style.", thumb: "price-minimal" },
  ],

  cta: [
    { key: "gradient-banner", label: "Gradient Banner", description: "Full-width brand gradient with a centred call to action.", thumb: "banner" },
    { key: "orange-banner", label: "Accent Banner", description: "Solid accent-colour banner, high urgency.", thumb: "banner" },
    { key: "navy-banner", label: "Navy Banner", description: "Deep, calm banner for professional services.", thumb: "banner-dark", dark: true },
    { key: "warm-banner", label: "Warm Banner", description: "Softer, inviting banner treatment.", thumb: "banner" },
    { key: "dark-split", label: "Dark Split", description: "Text one side, actions the other, on dark.", thumb: "split-cta", dark: true },
  ],

  features: [
    { key: "icon-list-cards", label: "Icon List Cards", description: "Icon, heading and copy per feature in a card grid.", thumb: "cards-grid" },
    { key: "bento-grid", label: "Bento Grid", description: "Mixed-size tiles — visually dynamic, modern.", thumb: "bento" },
    { key: "dark", label: "Dark Checklist", description: "Two-column checklist on a dark surface.", thumb: "list-rows", dark: true },
  ],

  faq: [
    { key: "accordion-bordered", label: "Bordered Accordion", description: "Expandable rows in outlined cards.", thumb: "accordion" },
    { key: "two-column-grid", label: "Two Column", description: "All answers visible across two columns — no clicking.", thumb: "two-col" },
  ],

  team: [
    { key: "avatar-cards", label: "Avatar Cards", description: "Photo cards with name, role and bio.", thumb: "avatar-cards" },
    { key: "minimal-list", label: "Minimal List", description: "Compact rows — good for larger teams.", thumb: "avatar-list" },
  ],

  gallery: [
    { key: "grid-clean", label: "Clean Grid", description: "Tight uniform grid, no gaps or captions.", thumb: "grid-tight" },
    { key: "masonry-captioned", label: "Masonry", description: "Mixed-height masonry with visible captions.", thumb: "masonry" },
  ],

  steps: [
    { key: "numbered-cards", label: "Numbered Cards", description: "Each step as a numbered card.", thumb: "steps-cards" },
    { key: "timeline-connected", label: "Connected Timeline", description: "Steps joined by a connecting line.", thumb: "steps-timeline" },
  ],

  icon_grid: [
    { key: "colored-tiles", label: "Coloured Tiles", description: "Filled tiles using brand colours.", thumb: "tiles" },
    { key: "minimal-inline", label: "Minimal Inline", description: "Icons and labels inline, no tile background.", thumb: "inline-icons" },
  ],
};

/** Variants available for a block type, always including its default layout. */
export function getVariantsForBlock(type: BlockType): BlockVariant[] {
  const variants = BLOCK_VARIANTS[type];
  if (!variants?.length) return [];
  return [DEFAULT_VARIANT, ...variants];
}

export function hasVariants(type: BlockType): boolean {
  return (BLOCK_VARIANTS[type]?.length ?? 0) > 0;
}
