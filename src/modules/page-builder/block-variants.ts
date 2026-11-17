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
 * legacy layout. The full key-by-key check against the renderers (Nov 2026)
 * is in block-audit/variants.md.
 *
 * The picker shows each option as a live render of the block itself
 * (components/admin/page-builder/previews), so the label, description and
 * `dark` flag below must describe what the renderer actually draws, on any
 * site palette: most "dark" looks follow the site's colours and are only dark
 * on a dark palette or a dark section Background.
 *
 * `thumb` is the wireframe the picker falls back to when a live render is not
 * possible (`VariantThumbnail`).
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
  /** Paints its own dark ground (dark colour, or a photo under a dark tint)
   *  whatever the site palette: a hint in the picker, and the "[dark]" tag the
   *  AI page planner reads. Not set for looks that follow the site's colours. */
  dark?: boolean;
  /** Paints its own full-width band and spacing; picking it zeroes the section padding. */
  edgeToEdge?: boolean;
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
    { key: "split-image-right", label: "Split Image", description: "Two columns: badge, headline, bullet points and buttons beside a rounded photo or slideshow.", thumb: "split-image" },
    { key: "fullscreen-overlay", label: "Fullscreen Overlay", description: "Tall photo under a dark tint, with white headline, text and buttons, centred or to one side.", thumb: "fullscreen", dark: true },
    { key: "centered-bold", label: "Centered Bold", description: "Large centred headline, text and buttons, with an optional wide photo underneath.", thumb: "centered" },
    { key: "dark-gradient-left", label: "Photo Fade", description: "Text on one side over a photo that fades into the page colour. With no photo, a dark navy gradient.", thumb: "gradient-left" },
    { key: "corporate", label: "Corporate", description: "Centred white text and buttons on a strong colour overlay (dark green unless set) with a faint grid.", thumb: "corporate", dark: true },
    { key: "spec-card", label: "Spec Card", description: "Dark photo hero, two-tone headline, glass card with spec bars and stats, link strip below.", thumb: "gradient-left", dark: true, edgeToEdge: true },
    { key: "page-banner", label: "Page Banner", description: "Inner-page header: dark photo, automatic breadcrumb, label, title and buttons.", thumb: "fullscreen", dark: true, edgeToEdge: true },
    { key: "product", label: "Product", description: "Label chip, large title, two buttons, a copyable command and a screenshot in a browser window. Light or dark text follows the Background.", thumb: "centered" },
  ],

  services: [
    { key: "icon-cards-grid", label: "Icon Cards", description: "Centred cards with a brand-colour top border, a large icon, title, text and link.", thumb: "cards-grid" },
    { key: "dark-grid-cards", label: "Icon Box Cards", description: "Bordered cards with the icon in a tinted square, then title, text and link. Follows the site colours.", thumb: "cards-grid" },
    { key: "site-showcase", label: "Website Showcase", description: "Browser-window cards: a bar with the web address, a screenshot, title, category chip and Visit link.", thumb: "cards-grid" },
    { key: "image-cards-dark", label: "Image Cards", description: "Bordered cards: photo with a dark tint at its foot, brand-colour title, short text and link.", thumb: "cards-grid" },
    { key: "bordered-list", label: "Side Accent Cards", description: "Two columns of bordered cards with a thick coloured left edge, small icon, title, text and link.", thumb: "list-rows" },
    { key: "numbered", label: "Numbered", description: "Brand-colour band of cards with large 01, 02 numbers, an icon or photo, title and short text.", thumb: "numbered-list" },
    { key: "menu-cards", label: "Photo and Text", description: "No card boxes: a rounded photo, then the title, text and link under it. Needs a photo per item.", thumb: "cards-grid" },
    { key: "program-cards-dark", label: "Program Cards", description: "Square cards with a brand-colour top border, a photo with a dark fade, upper-case title, text, link.", thumb: "cards-grid" },
    { key: "image-tiles", label: "Image Tiles", description: "Framed photo tiles with the title and an arrow button underneath, then the text.", thumb: "cards-grid" },
    { key: "bento", label: "Bento", description: "Photo tiles in mixed sizes (one big lead, one wide, the rest small) with white text on a dark fade.", thumb: "bento", dark: true },
    { key: "photo-cards", label: "Photo Cards", description: "Tall photo cards with a dark fade, small label, white title and detail lines, plus a View all link.", thumb: "grid-tight", dark: true },
    { key: "boutique-tiles", label: "Boutique Tiles", description: "Photo tiles with an upper-case serif caption and optional pill button. 2 columns = category banners.", thumb: "grid-tight" },
  ],

  testimonials: [
    { key: "quote-cards", label: "Quote Cards", description: "Three-column cards with stars, the quote, and the person's photo, name and role.", thumb: "quote-cards" },
    { key: "photo-cards", label: "Photo Cards", description: "Tan cards, three per view: round photo, headline, quote, name and outline stars; swipes with dots.", thumb: "quote-cards" },
    { key: "stars-quotes", label: "Stars + Quotes", description: "Gold stars, centred quote and name; two per view, sliding with dots.", thumb: "quote-minimal" },
    { key: "dark-quote-cards", label: "Gradient Edge Cards", description: "Two-column cards inside a thin brand-colour gradient frame: stars, quote, photo, name and role.", thumb: "quote-cards" },
    { key: "full-width", label: "Full Width", description: "One quote at a time on a brand-colour band, with photo and name; changes every few seconds.", thumb: "quote-wide" },
    { key: "minimal-quote", label: "Minimal", description: "The first three reviews in columns split by thin lines: quote mark, italic quote, photo, name, stars.", thumb: "quote-minimal" },
    { key: "warm-cards", label: "Italic Quote Cards", description: "Two-column bordered cards with stars, an italic quote and a ruled footer with photo and name.", thumb: "quote-cards" },
    { key: "formal-cards", label: "Formal Cards", description: "Two-column square cards with a large quote mark, stars, the quote and a ruled author row.", thumb: "quote-cards" },
    { key: "transformation-cards", label: "Featured Quote", description: "Two-column cards; the first spans both columns with a brand tint and a larger quote.", thumb: "quote-cards" },
    { key: "review-cards", label: "Review Cards", description: "Shop reviews: square photo, short quote, gold stars, name with verified tick and the product reviewed.", thumb: "quote-cards" },
  ],

  stats: [
    { key: "colored-row", label: "Coloured Row", description: "Rounded brand-gradient panel holding tiles with an optional icon, big number and label.", thumb: "stat-gradient" },
    { key: "bold-dark-row", label: "Divided Cells", description: "Cells split by thin lines, with heavy brand-colour numbers and spaced upper-case labels.", thumb: "stat-row" },
    { key: "dark-band", label: "Brand Band", description: "Brand-colour band (or your own band colour) with light numbers and labels split by faint lines.", thumb: "stat-row" },
    { key: "gradient-numbers", label: "Outlined Tiles", description: "Outlined tiles with an optional icon, a heavy brand-colour number and an upper-case label.", thumb: "stat-row" },
    { key: "navy-row", label: "Simple Row", description: "A plain row of bold brand-colour numbers with labels under them; no background or borders.", thumb: "stat-row" },
    { key: "warm-row", label: "Italic Numbers", description: "A plain row of italic brand-colour numbers, each over a short rule and its label.", thumb: "stat-row" },
    { key: "plain-dark", label: "Thin Numbers", description: "Large thin brand-colour numbers over a short rule and a spaced upper-case label.", thumb: "stat-row" },
  ],

  pricing: [
    { key: "highlighted-cards", label: "Highlighted Cards", description: "Plan cards with price, checklist and button; the recommended plan is brand-coloured and lifted.", thumb: "price-cards" },
    { key: "dark-cards", label: "Soft Highlight", description: "Plan cards; the recommended one gets a soft brand tint, brand border, glow and badge.", thumb: "price-cards" },
    { key: "dark", label: "Brand Band Cards", description: "Compact plan cards on a brand-colour band; the recommended plan is a solid light card.", thumb: "price-cards" },
    { key: "minimal-dark", label: "Minimal Cards", description: "Square bordered plan cards, light plan names, price under a rule; the pick gets a brand border.", thumb: "price-cards" },
    { key: "membership-cards", label: "Membership", description: "Square bordered plan cards with heavy upper-case names, large prices and checklists.", thumb: "price-cards" },
    { key: "menu-pricing", label: "Italic Price Cards", description: "Narrow grid of rounded plan cards with italic names, brand-colour prices and star bullets.", thumb: "price-cards" },
    { key: "spec-cards", label: "Spec Cards", description: "Old and new price, spec bars, included/excluded items, WhatsApp buttons. Highlighted plan turns dark.", thumb: "price-cards" },
    { key: "pro-tiers", label: "Pro Tiers", description: "All plans in one row, price first; the recommended plan gets a brand-colour border. Nothing else is filled with colour.", thumb: "price-minimal" },
  ],

  cta: [
    { key: "gradient-banner", label: "Gradient Banner", description: "Rounded brand-gradient card with a white headline, text and button, centred or split.", thumb: "banner" },
    { key: "orange-banner", label: "Bold Banner", description: "Square-cornered brand gradient panel with a heavy upper-case headline, text and a white button.", thumb: "banner" },
    { key: "navy-banner", label: "Brand Banner", description: "Square-cornered solid brand-colour panel with headline, text and a white button, centred or split.", thumb: "banner" },
    { key: "warm-banner", label: "Tinted Card Banner", description: "Rounded card with a light brand tint and border, an italic headline and a brand-colour button.", thumb: "banner" },
    { key: "dark-split", label: "Bordered Card Banner", description: "Bordered card with a light headline, text and brand button; centred, or split when Layout is split.", thumb: "split-cta" },
    { key: "boutique-banner", label: "Boutique Banner", description: "No ground of its own: spaced label, serif title and pill buttons over the section's Background photo.", thumb: "fullscreen", dark: true },
    { key: "pro-band", label: "Pro Band", description: "A sentence, two buttons and an optional copyable command on the section Background itself; no card or gradient.", thumb: "banner" },
    { key: "visit-map", label: "Visit + Map", description: "Dark band with address, phone, hours, WhatsApp and directions buttons, and a live map. Uses your contact details.", thumb: "split-cta", dark: true, edgeToEdge: true },
  ],

  features: [
    { key: "icon-list-cards", label: "Icon List Cards", description: "One column of wide bordered cards, each with an icon or round photo, title, text and optional button.", thumb: "list-rows" },
    { key: "highlight-cards", label: "Highlight Cards", description: "Card grid with a thick brand-colour top edge, icon, title, text and optional button; lifts on hover.", thumb: "cards-grid" },
    { key: "centered-icons", label: "Centered Icons", description: "Centred items without cards: icon in a tinted square, title, text and optional button.", thumb: "cards-grid" },
    { key: "bento-grid", label: "Bento Grid", description: "Three-column grid of bordered tiles; the first tile spans two columns and two rows.", thumb: "bento" },
    { key: "numbered-columns", label: "Numbered Columns", description: "Columns with a brand-colour rule on top, a small 01, 02 number, title and text. No icons.", thumb: "numbered-list" },
    { key: "split-list", label: "Split List", description: "Title and intro pinned on the left; rows of icon, title and text on the right.", thumb: "two-col" },
    { key: "alternating-media", label: "Alternating Media", description: "One row per feature, its image on alternating sides beside the title, text and optional button.", thumb: "list-rows" },
    { key: "dark", label: "Gradient Checklist", description: "Brand-gradient box: title and text on the left, a checklist of the feature titles on the right.", thumb: "list-rows" },
    { key: "overview-quote", label: "Overview + Side Card", description: "Intro text and tag chips beside a sticky card with photo, text and a (WhatsApp) button.", thumb: "two-col" },
    { key: "numbered-grid", label: "Numbered Grid", description: "Numbered tiles (01, 02...) on a full-width dark band, or a light bordered grid when Tone is light.", thumb: "numbered-list", dark: true, edgeToEdge: true },
    { key: "image-stats", label: "Image + Stats", description: "Photo with a dark floating badge beside heading, text, big-number tiles and buttons.", thumb: "split-image" },
    { key: "text-tiles", label: "Text + Tiles", description: "Heading, text and buttons on the left; a two-column grid of icon tiles on the right.", thumb: "split-image" },
    { key: "arrow-cards", label: "Arrow Cards", description: "Cards in two or three columns, each with its icon on a dark arrow-shaped panel, then title and text.", thumb: "list-rows" },
    { key: "pro-bento", label: "Pro Bento", description: "Hairline tiles of mixed widths; a tile with a picture shows it in a small window. Each tile can carry a small chip.", thumb: "bento" },
    { key: "pro-grid", label: "Pro Grid", description: "No cards: left-aligned heading, then items in columns under hairlines with a line icon, title and text.", thumb: "cards-grid" },
    { key: "pro-split", label: "Pro Split", description: "Heading, text and a framed picture on one side; a ruled checklist of the items on the other.", thumb: "two-col" },
  ],

  faq: [
    { key: "accordion-bordered", label: "Bordered Accordion", description: "Stacked bordered rows; a question opens to show its answer.", thumb: "accordion" },
    { key: "minimal-lines", label: "Minimal Lines", description: "Questions split by hairlines, with a plus that turns into a cross when open.", thumb: "accordion" },
    { key: "dark-accordion", label: "Tinted Accordion", description: "Rounded rows with a faint tint and no borders; the open row gets a brand-colour ring.", thumb: "accordion" },
    { key: "split-heading", label: "Split Heading", description: "Title, text and an optional photo pinned on the left; the questions open and close on the right.", thumb: "two-col" },
    { key: "two-column-grid", label: "Two Column", description: "Two columns of questions with every answer shown underneath; no boxes, no clicking.", thumb: "two-col" },
    { key: "boxed-two-column", label: "Boxed Two Column", description: "Two columns of grey boxes with a brand-colour left edge, every answer open.", thumb: "two-col" },
    { key: "cards-grid", label: "Cards Grid", description: "Each question and its answer in its own card, up to three columns.", thumb: "cards-grid" },
    { key: "numbered-list", label: "Numbered List", description: "One column of open questions, each with a large faded 01, 02 number.", thumb: "numbered-list" },
  ],

  team: [
    { key: "avatar-cards", label: "Avatar Cards", description: "Centred cards: round photo or initials, name, role, phone, bio and social icons.", thumb: "avatar-cards" },
    { key: "bordered-grid", label: "Bordered Grid", description: "Cells split by hairlines inside one rounded border: small round photo, name, role, phone.", thumb: "avatar-cards" },
    { key: "dark-cards", label: "Tinted Cards", description: "Cards with a faint tint and a brand-colour top rule: round photo, name, role and bio.", thumb: "avatar-cards" },
    { key: "photo-tiles", label: "Photo Tiles", description: "Square photos with the name, role and phone in white over a dark fade.", thumb: "grid-tight" },
    { key: "minimal-list", label: "Minimal List", description: "One column of rows: small round photo, name and role, social icons on the right.", thumb: "avatar-list" },
    { key: "compact-grid", label: "Compact Grid", description: "Dense grid without cards: small round photo beside name, role and phone. For big teams.", thumb: "avatar-list" },
    { key: "bio-rows", label: "Bio Rows", description: "One row per person, sides alternating: large photo beside name, role, phone and bio.", thumb: "list-rows" },
    { key: "centered-feature", label: "Centered Feature", description: "One person per row, centred: large round photo, name, role, phone and bio.", thumb: "centered" },
    { key: "message", label: "Message", description: "Founder or MD statement: large photo beside their message (bio field), signed with name and role.", thumb: "split-image" },
  ],

  gallery: [
    { key: "grid-clean", label: "Clean Grid", description: "Square photos in an even grid with hairline gaps and square corners; no captions.", thumb: "grid-tight" },
    { key: "dark-grid", label: "Panel Grid", description: "A rounded panel with a faint tint holding a tight grid of rounded photos; no captions.", thumb: "grid-tight" },
    { key: "masonry-captioned", label: "Masonry", description: "Uncropped photos in columns of mixed heights, with a dark caption strip where set.", thumb: "masonry" },
    { key: "hero-mosaic", label: "Hero Mosaic", description: "The first photo large on the left, the next four in a grid beside it.", thumb: "bento" },
    { key: "captioned-cards", label: "Captioned Cards", description: "Bordered cards, each a photo with its caption always shown underneath.", thumb: "cards-grid" },
    { key: "document-cards", label: "Document Cards", description: "Visas, certificates, awards: the whole image (never cropped) with country, title and date.", thumb: "cards-grid" },
    { key: "full-bleed-rows", label: "Wide Photo Rows", description: "One wide rounded photo per row, with its caption in white over a dark fade.", thumb: "list-rows" },
    { key: "filmstrip", label: "Filmstrip", description: "One row of photos that scrolls sideways; no captions.", thumb: "grid-tight" },
    { key: "polaroid-scatter", label: "Polaroid Scatter", description: "Photos in card-colour frames, each slightly tilted, with the caption under it.", thumb: "masonry" },
  ],

  steps: [
    { key: "numbered-cards", label: "Numbered Cards", description: "Bordered cards with a large faded 01, 02 number in the corner, optional icon, title and text.", thumb: "steps-cards" },
    { key: "timeline-connected", label: "Connected Timeline", description: "Steps down a thin line, each with a filled brand circle (number or icon), title, text and photo.", thumb: "steps-timeline" },
    { key: "vertical-line", label: "Vertical Line", description: "Left-aligned heading; a thin line down the left with small numbered circles beside each step.", thumb: "steps-timeline" },
    { key: "big-numbers", label: "Big Numbers", description: "Steps without cards; each title sits over a large faded number.", thumb: "numbered-list" },
    { key: "icon-row", label: "Icon Row", description: "Centred columns with the icon in a tinted square, title and text. No numbers; set an icon per step.", thumb: "inline-icons" },
    { key: "arrow-flow", label: "Arrow Flow", description: "One row of bordered cards with a number badge, title and text, joined by arrows.", thumb: "steps-cards" },
    { key: "dark-cards", label: "Tinted Step Cards", description: "Cards with a faint tint and a brand-colour left border: a Step label, title and text.", thumb: "steps-cards" },
    { key: "split-media", label: "Split Media", description: "One row per step, its photo on alternating sides beside a Step label, title and text.", thumb: "list-rows" },
  ],

  icon_grid: [
    { key: "colored-tiles", label: "Coloured Tiles", description: "Solid tiles cycling blue, green, amber, rose, violet and cyan, with white icon, label and text.", thumb: "tiles" },
    { key: "circle-icons", label: "Large Icons", description: "Large centred icon over the label and text; a round tint sits behind it when the item has a colour.", thumb: "tiles" },
    { key: "outlined-cards", label: "Outlined Cards", description: "Bordered cards with a small icon beside the label and text, or a photo.", thumb: "cards-grid" },
    { key: "bordered-matrix", label: "Bordered Matrix", description: "Cells split by hairlines inside one rounded border: small icon over a small label.", thumb: "grid-tight" },
    { key: "dark-tiles", label: "Tinted Tiles", description: "Centred rounded tiles with a faint tint: brand-colour icon, label and text.", thumb: "tiles" },
    { key: "numbered-features", label: "Numbered Reasons", description: "Items with a faded 01, 02 number beside the label and text; no icons.", thumb: "numbered-list" },
    { key: "pill-row", label: "Pill Row", description: "Centred wrapping row of bordered pills, each a small icon and label; no descriptions.", thumb: "inline-icons" },
    { key: "minimal-inline", label: "Outlined Pills", description: "Wrapping row of bordered pills with icon and label; rounded boxes when descriptions are shown.", thumb: "inline-icons" },
    { key: "grouped-list", label: "Grouped List", description: "Long name lists (clients, partners) in groups: item = group title, description = one name per line.", thumb: "list-rows" },
    { key: "logo-strip", label: "Logo Strip", description: "Partner or accreditation logos on white tiles with a label under each. Set an image per item.", thumb: "tiles" },
  ],

  // --- Blocks below drive their layout from a `data` field, not
  // `templateVariant` — see VARIANT_DATA_FIELD. Keys must match the field's
  // union exactly.

  timeline: [
    { key: "vertical", label: "Vertical", description: "One column with dots down the left; reads as a history.", thumb: "steps-timeline" },
    { key: "alternating", label: "Alternating", description: "Entries zig-zag either side of a centre line.", thumb: "steps-timeline" },
    { key: "horizontal", label: "Horizontal", description: "Numbered circles joined left to right, each with its title and text; good for a short process.", thumb: "numbered-list" },
  ],

  newsletter: [
    { key: "inline", label: "Inline", description: "Heading on the left, field and button on one row; fits inside a footer.", thumb: "banner" },
    { key: "centered", label: "Centered", description: "Centred heading, then the field and button on one row.", thumb: "centered" },
    { key: "stacked", label: "Stacked", description: "All centred, with the field above the button.", thumb: "centered" },
    { key: "card", label: "Card", description: "Centred heading and a field-and-button row inside a bordered card.", thumb: "cards-grid" },
  ],

  countdown: [
    { key: "boxes", label: "Boxes", description: "Each unit in its own bordered tile, with colons between.", thumb: "tiles" },
    { key: "minimal", label: "Minimal", description: "Large numbers with small labels, separated by colons; no boxes.", thumb: "inline-icons" },
    { key: "flip", label: "Plain", description: "Large numbers with small upper-case labels; no boxes or colons.", thumb: "inline-icons" },
  ],

  contact: [
    { key: "left", label: "Left", description: "Form on the left, contact details (or the map) on the right.", thumb: "two-col" },
    { key: "centered", label: "Centered", description: "One narrow centred column: contact details first, then the form.", thumb: "centered" },
    { key: "split", label: "Split", description: "Tinted panel with the heading and contact details on the left, the form on the right.", thumb: "split-image" },
  ],

  blog: [
    { key: "grid", label: "Grid", description: "Even card grid: the standard post listing.", thumb: "cards-grid" },
    { key: "list", label: "List", description: "Full-width rows, thumbnail beside the excerpt.", thumb: "list-rows" },
  ],

  navigation: [
    { key: "default", label: "Default", description: "Logo with the menu beside it, buttons on the right: the familiar bar.", thumb: "banner" },
    { key: "centered", label: "Centered", description: "Logo on the left, the menu centred in the bar, buttons on the right.", thumb: "centered" },
    { key: "logo-center", label: "Logo Centered", description: "Logo in the middle of the top row (search on the left if on), the menu on its own row below.", thumb: "centered" },
    { key: "logo-center-inline", label: "Logo Centered, One Row", description: "One row: menu on the left, logo in the middle, social icons and buttons on the right.", thumb: "banner" },
  ],

  footer: [
    { key: "dark", label: "Dark", description: "Brand gradient (your secondary into primary colour) with light text: the usual anchor.", thumb: "cards-dark", dark: true },
    { key: "light", label: "Light", description: "Soft gradient of the page's muted and card colours with dark text.", thumb: "list-rows" },
    { key: "colored", label: "Coloured", description: "Your own background and text colours from the footer settings; looks like Dark until set.", thumb: "list-rows" },
    { key: "retail", label: "Retail", description: "Shop footer: link columns, a Follow us icon column, copyright and payment logos.", thumb: "list-rows" },
  ],

  video: [
    { key: "framed", label: "Framed", description: "The player inside a rounded muted-colour panel, caption underneath.", thumb: "cards-grid" },
    { key: "card", label: "Card", description: "The player inside a bordered card with a large shadow, caption inside it.", thumb: "cards-grid" },
    { key: "cinematic", label: "Cinematic", description: "Square-cornered player on a black band, for a feature video.", thumb: "fullscreen", dark: true },
    { key: "gallery", label: "Video Gallery", description: "Several videos as a grid of thumbnails; each plays when clicked.", thumb: "cards-grid" },
    { key: "playlist", label: "Playlist", description: "One big player with a clickable list of videos beside it.", thumb: "split-image" },
  ],

  slider: [
    { key: "left-copy", label: "Left Copy", description: "Full-image slides with the text on the left over a dark scrim, the photo clear on the right.", thumb: "gradient-left" },
    { key: "split", label: "Split", description: "Photo on the left half, text on a page-colour panel on the right.", thumb: "split-image" },
    { key: "minimal", label: "Minimal", description: "Full-image slides with a small title bar along the bottom.", thumb: "grid-tight" },
  ],

  item_box: [
    { key: "grid", label: "Grid", description: "Even card grid: the standard layout.", thumb: "cards-grid" },
    { key: "list", label: "List", description: "Full-width stacked rows.", thumb: "list-rows" },
  ],

  ecommerce_products: [
    { key: "grid", label: "Grid", description: "Even product card grid: the standard listing.", thumb: "cards-grid" },
    { key: "list", label: "List", description: "Full-width rows, image beside details.", thumb: "list-rows" },
    { key: "featured", label: "Featured", description: "One large lead product above the rest.", thumb: "split-image" },
    { key: "minimal", label: "Minimal", description: "Image and price only, no extra chrome.", thumb: "grid-tight" },
    { key: "wide-cards", label: "Wide Cards", description: "Wider cards with more room for description.", thumb: "cards-grid" },
    { key: "carousel", label: "Carousel", description: "One sliding row of products with arrows.", thumb: "grid-tight" },
  ],
};

/**
 * What the renderer draws when the variant value is unset, or is a key it does
 * not implement (seed scripts and old templates saved keys like features
 * "alternating-images" or navigation style "classic"). The picker highlights
 * this option, so the ticked tile is always the layout the canvas shows.
 * `null`: what is drawn matches none of the options, so none is ticked.
 * templateVariant blocks not listed here fall back to their Default ("").
 */
export const VARIANT_FALLBACK: Partial<Record<BlockType, string | null>> = {
  // PricingVariant has no fallback branch: an unknown key draws no plans.
  pricing: null,
  timeline: "vertical",
  newsletter: "centered",
  countdown: "flip",
  // A full-width centred stack: neither Centered (narrow column) nor the others.
  contact: null,
  blog: "grid",
  navigation: "default",
  footer: "dark",
  item_box: "grid",
  ecommerce_products: "grid",
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

/**
 * Cards offers every layout of the blocks it replaced. Each family's original
 * default look is a named layout here (`*-classic`), since Cards has no
 * "unset" state.
 */
function cardsVariants(): BlockVariant[] {
  return [
    { key: "services-classic", label: "Service Cards", description: "The classic services grid, list or cards.", thumb: "cards-grid" },
    ...(BLOCK_VARIANTS.services ?? []),
    { key: "features-classic", label: "Feature Grid", description: "The classic Why Choose Us grid.", thumb: "cards-grid" },
    ...(BLOCK_VARIANTS.features ?? []),
    { key: "icons-classic", label: "Icon Grid", description: "Simple icons with labels.", thumb: "cards-grid" },
    ...(BLOCK_VARIANTS.icon_grid ?? []),
    { key: "smart-cards", label: "Live Content Cards", description: "Cards filled from your services, portfolio, blog, pages or catalogue.", thumb: "cards-grid" },
  ];
}

/** Variants available for a block type, always including its default layout. */
export function getVariantsForBlock(type: BlockType): BlockVariant[] {
  if (type === "cards") return cardsVariants();
  const variants = BLOCK_VARIANTS[type];
  if (!variants?.length) return [];
  // Data-field blocks have no "unset" state to return to — every value is a
  // real layout — so the Default tile would be a dead option.
  if (VARIANT_DATA_FIELD[type]) return variants;
  return [DEFAULT_VARIANT, ...variants];
}

export function hasVariants(type: BlockType): boolean {
  if (type === "cards") return true;
  return (BLOCK_VARIANTS[type]?.length ?? 0) > 0;
}
