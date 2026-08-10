/**
 * Blocks offered in the header builder.
 *
 * A header is a narrow, always-visible strip — a pricing table or blog roll in
 * there is almost certainly a mistake rather than a choice, so the palette is
 * restricted rather than showing all 52 block types. These are the ones that
 * genuinely appear in real site headers: the nav bar itself, a top announcement
 * strip, a logo/text lockup, a call-to-action, and layout primitives for
 * arranging them.
 */
import type { BlockType } from "@/types/cms";
import type { BlockDefinition } from "@/modules/page-builder/block-registry";

export const HEADER_BLOCK_TYPES: readonly BlockType[] = [
  "navigation",
  "text",
  "cta",
  "columns",
  "container",
  "spacer",
  "divider",
  "custom_html",
] as const;

/** Same idea for the footer, which carries more than a header does — link
 *  columns, a newsletter signup, contact details. */
export const FOOTER_BLOCK_TYPES: readonly BlockType[] = [
  "footer",
  "navigation",
  "text",
  "newsletter",
  "contact",
  "columns",
  "container",
  "spacer",
  "divider",
  "icon_grid",
  "custom_html",
] as const;

/**
 * Relabels for this restricted palette. The registry's own names ("Menu Bar",
 * "Action Banner", "Side-by-Side Text"…) are written for the general page
 * builder — accurate there, but they don't read as header/footer elements
 * out of that context, which was confusing on its own screen. Only entries
 * that actually needed a clearer name are listed; everything else keeps its
 * normal registry label.
 */
type DisplayOverrides = Partial<Record<BlockType, Partial<Pick<BlockDefinition, "label" | "description" | "icon">>>>;

export const HEADER_BLOCK_DISPLAY: DisplayOverrides = {
  navigation: { label: "Nav Menu", description: "Logo, menu links and an optional button — the header itself." },
  cta: { label: "Announcement Bar", description: "A slim banner above or below the nav — a promo, notice, or extra call-to-action." },
  columns: { label: "Side-by-Side Layout", description: "Two columns for arranging header content, e.g. a logo beside a phone number." },
  container: { label: "Grouping Box", description: "Groups other blocks together so they can be styled or aligned as one." },
  spacer: { label: "Blank Space", description: "Adds vertical gap between blocks." },
  divider: { label: "Divider Line", description: "A thin horizontal rule." },
};

export const FOOTER_BLOCK_DISPLAY: DisplayOverrides = {
  ...HEADER_BLOCK_DISPLAY,
  footer: { label: "Footer Columns", description: "Logo, link columns, socials and copyright — the standard footer layout." },
  navigation: { label: "Extra Nav Links", description: "A second link row, separate from the footer's own columns." },
  newsletter: { label: "Newsletter Signup", description: "An email capture form." },
  contact: { label: "Contact Details", description: "Phone, email, address — or a short contact form." },
  icon_grid: { label: "Badges / Certifications", description: "A row of small icons with labels, e.g. payment methods or licenses." },
};
