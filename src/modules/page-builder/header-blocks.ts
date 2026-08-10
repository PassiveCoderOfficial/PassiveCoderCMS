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
