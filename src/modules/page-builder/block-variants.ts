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
  /** Value written to `block.templateVariant`, or to `block.data[dataField]`
   *  when the block's list sets one. */
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
    { key: "highlight-cards", label: "Highlight Cards", description: "Coloured top edge, lifts on hover — more energetic.", thumb: "cards-grid" },
    { key: "centered-icons", label: "Centered Icons", description: "Centered icon, heading and copy. The safe default.", thumb: "cards-grid" },
    { key: "bento-grid", label: "Bento Grid", description: "Mixed-size tiles — visually dynamic, modern.", thumb: "bento" },
    { key: "numbered-columns", label: "Numbered Columns", description: "Numbered columns with a rule above each, no icons.", thumb: "numbered-list" },
    { key: "split-list", label: "Split List", description: "Heading pinned left, features listed right.", thumb: "two-col" },
    { key: "alternating-media", label: "Alternating Media", description: "Wide alternating rows pairing each feature with an image.", thumb: "list-rows" },
    { key: "dark", label: "Dark Checklist", description: "Two-column checklist on a dark surface.", thumb: "list-rows", dark: true },
  ],

  faq: [
    { key: "accordion-bordered", label: "Bordered Accordion", description: "Expandable rows in outlined cards.", thumb: "accordion" },
    { key: "minimal-lines", label: "Minimal Lines", description: "Hairline rules and a plus toggle — the quietest treatment.", thumb: "accordion" },
    { key: "dark-accordion", label: "Dark Accordion", description: "Lifted surfaces instead of borders, tuned for dark palettes.", thumb: "accordion", dark: true },
    { key: "split-heading", label: "Split Heading", description: "Title pinned left, questions scroll on the right.", thumb: "two-col" },
    { key: "two-column-grid", label: "Two Column", description: "All answers visible across two columns — no clicking.", thumb: "two-col" },
    { key: "boxed-two-column", label: "Boxed Two Column", description: "Accent-edged boxes, everything open. Dense and scannable.", thumb: "two-col" },
    { key: "cards-grid", label: "Cards Grid", description: "Each question in its own card across three columns.", thumb: "cards-grid" },
    { key: "numbered-list", label: "Numbered List", description: "Numbered like a reference document — methodical, thorough.", thumb: "numbered-list" },
  ],

  team: [
    { key: "avatar-cards", label: "Avatar Cards", description: "Photo cards with name, role and bio.", thumb: "avatar-cards" },
    { key: "bordered-grid", label: "Bordered Grid", description: "Hairline-divided grid — architectural and restrained.", thumb: "avatar-cards" },
    { key: "dark-cards", label: "Dark Cards", description: "Lifted cards with an accent rule, for dark palettes.", thumb: "avatar-cards", dark: true },
    { key: "photo-tiles", label: "Photo Tiles", description: "Full-bleed square photos with the name overlaid.", thumb: "grid-tight" },
    { key: "minimal-list", label: "Minimal List", description: "Compact rows — good for larger teams.", thumb: "avatar-list" },
    { key: "compact-grid", label: "Compact Grid", description: "Small avatars in a dense grid, for big teams.", thumb: "avatar-list" },
    { key: "bio-rows", label: "Bio Rows", description: "Alternating wide rows with room for a real bio.", thumb: "list-rows" },
    { key: "centered-feature", label: "Centered Feature", description: "One person per row, centered — founder-led brands.", thumb: "centered" },
  ],

  gallery: [
    { key: "grid-clean", label: "Clean Grid", description: "Tight uniform grid, no gaps or captions.", thumb: "grid-tight" },
    { key: "dark-grid", label: "Dark Grid", description: "Tight grid on a dark panel — images carry the colour.", thumb: "grid-tight", dark: true },
    { key: "masonry-captioned", label: "Masonry", description: "Mixed-height masonry with visible captions.", thumb: "masonry" },
    { key: "hero-mosaic", label: "Hero Mosaic", description: "One large lead image with a supporting grid.", thumb: "bento" },
    { key: "captioned-cards", label: "Captioned Cards", description: "Each image in a card with its caption always visible.", thumb: "cards-grid" },
    { key: "full-bleed-rows", label: "Full Bleed Rows", description: "Wide cinematic bands, one per row.", thumb: "list-rows" },
    { key: "filmstrip", label: "Filmstrip", description: "Horizontal scrolling strip — compact and secondary.", thumb: "grid-tight" },
    { key: "polaroid-scatter", label: "Polaroid Scatter", description: "Tilted framed shots — informal and warm.", thumb: "masonry" },
  ],

  steps: [
    { key: "numbered-cards", label: "Numbered Cards", description: "Each step as a numbered card.", thumb: "steps-cards" },
    { key: "timeline-connected", label: "Connected Timeline", description: "Steps joined by a connecting line.", thumb: "steps-timeline" },
    { key: "vertical-line", label: "Vertical Line", description: "Left rail with markers — good for longer processes.", thumb: "steps-timeline" },
    { key: "big-numbers", label: "Big Numbers", description: "Oversized ghosted numerals behind each step.", thumb: "numbered-list" },
    { key: "icon-row", label: "Icon Row", description: "Icon-led rather than number-led.", thumb: "inline-icons" },
    { key: "arrow-flow", label: "Arrow Flow", description: "Chevrons between steps make the sequence explicit.", thumb: "steps-cards" },
    { key: "dark-cards", label: "Dark Cards", description: "Numbered cards on lifted surfaces, for dark palettes.", thumb: "steps-cards", dark: true },
    { key: "split-media", label: "Split Media", description: "Alternating rows pairing each step with its image.", thumb: "list-rows" },
  ],

  icon_grid: [
    { key: "colored-tiles", label: "Coloured Tiles", description: "Filled tiles using brand colours.", thumb: "tiles" },
    { key: "circle-icons", label: "Circle Icons", description: "Circular icon badges above centered labels.", thumb: "tiles" },
    { key: "outlined-cards", label: "Outlined Cards", description: "Hairline cards with the icon inline beside the label.", thumb: "cards-grid" },
    { key: "bordered-matrix", label: "Bordered Matrix", description: "Cells divided by hairlines — dense and technical.", thumb: "grid-tight" },
    { key: "dark-tiles", label: "Dark Tiles", description: "Lifted tiles with an accent icon, for dark palettes.", thumb: "tiles", dark: true },
    { key: "numbered-features", label: "Numbered", description: "Numbered instead of iconed — reads as ordered reasons.", thumb: "numbered-list" },
    { key: "pill-row", label: "Pill Row", description: "Wrapping pills — compact, reads as tags.", thumb: "inline-icons" },
    { key: "minimal-inline", label: "Minimal Inline", description: "Icons and labels inline, no tile background.", thumb: "inline-icons" },
  ],

  // --- Blocks below drive their layout from a `data` field, not
  // `templateVariant` — see VARIANT_DATA_FIELD. Keys must match the field's
  // union exactly.

  timeline: [
    { key: "vertical", label: "Vertical", description: "One column, dots down the left — reads as a history.", thumb: "steps-timeline" },
    { key: "alternating", label: "Alternating", description: "Entries zig-zag either side of a centre line.", thumb: "steps-timeline" },
    { key: "horizontal", label: "Horizontal", description: "Left-to-right track — good for a short process.", thumb: "numbered-list" },
  ],

  newsletter: [
    { key: "inline", label: "Inline", description: "Field and button on one row — fits inside a footer.", thumb: "banner" },
    { key: "stacked", label: "Stacked", description: "Centred, field above button — a full-width band.", thumb: "centered" },
    { key: "card", label: "Card", description: "Boxed on its own surface, lifted off the page.", thumb: "cards-grid" },
  ],

  countdown: [
    { key: "boxes", label: "Boxes", description: "Each unit in its own tile — the standard timer.", thumb: "tiles" },
    { key: "minimal", label: "Minimal", description: "Plain numbers with small labels, no boxes.", thumb: "inline-icons" },
  ],

  contact: [
    { key: "left", label: "Left", description: "Form left, contact details right.", thumb: "two-col" },
    { key: "centered", label: "Centered", description: "Single narrow column, form centred on the page.", thumb: "centered" },
    { key: "split", label: "Split", description: "Form on one half against a filled panel on the other.", thumb: "split-image" },
  ],

  blog: [
    { key: "grid", label: "Grid", description: "Even card grid — the standard post listing.", thumb: "cards-grid" },
    { key: "list", label: "List", description: "Full-width rows, thumbnail beside the excerpt.", thumb: "list-rows" },
  ],

  navigation: [
    { key: "default", label: "Default", description: "Logo left, links right — the familiar bar.", thumb: "banner" },
    { key: "centered", label: "Centered", description: "Logo centred, links spread either side.", thumb: "centered" },
  ],

  footer: [
    { key: "dark", label: "Dark", description: "Dark ground with light text — the usual anchor.", thumb: "cards-dark", dark: true },
    { key: "light", label: "Light", description: "Keeps the page's light ground, separated by a rule.", thumb: "list-rows" },
  ],

  item_box: [
    { key: "grid", label: "Grid", description: "Even card grid — the standard layout.", thumb: "cards-grid" },
    { key: "list", label: "List", description: "Full-width stacked rows.", thumb: "list-rows" },
  ],

  ecommerce_products: [
    { key: "grid", label: "Grid", description: "Even product card grid — the standard listing.", thumb: "cards-grid" },
    { key: "list", label: "List", description: "Full-width rows, image beside details.", thumb: "list-rows" },
    { key: "featured", label: "Featured", description: "One large lead product above the rest.", thumb: "split-image" },
    { key: "minimal", label: "Minimal", description: "Image and price only, no extra chrome.", thumb: "grid-tight" },
    { key: "wide-cards", label: "Wide Cards", description: "Wider cards with more room for description.", thumb: "cards-grid" },
  ],
};

/**
 * Blocks whose layouts live in their own `data` field rather than
 * `templateVariant`.
 *
 * Several blocks (timeline, newsletter, countdown, nav, footer…) already
 * render multiple layouts, driven by a `layout` or `style` field that was only
 * reachable through a dropdown buried in that block's settings — or, for some,
 * through no UI at all. Rather than reimplementing those layouts a second time
 * behind `templateVariant`, the picker writes to the field the block already
 * reads. One layout mechanism per block, and the pickers stay identical.
 *
 * These lists therefore have no Default entry: the field is required, so one
 * of its values is always active.
 */
export const VARIANT_DATA_FIELD: Partial<Record<BlockType, string>> = {
  timeline: "layout",
  newsletter: "layout",
  countdown: "layout",
  contact: "layout",
  blog: "layout",
  navigation: "style",
  footer: "style",
  item_box: "layout",
  ecommerce_products: "layout",
};

/** Variants available for a block type, always including its default layout. */
export function getVariantsForBlock(type: BlockType): BlockVariant[] {
  const variants = BLOCK_VARIANTS[type];
  if (!variants?.length) return [];
  // Data-field blocks have no "unset" state to return to — every value is a
  // real layout — so the Default tile would be a dead option.
  if (VARIANT_DATA_FIELD[type]) return variants;
  return [DEFAULT_VARIANT, ...variants];
}

export function hasVariants(type: BlockType): boolean {
  return (BLOCK_VARIANTS[type]?.length ?? 0) > 0;
}
