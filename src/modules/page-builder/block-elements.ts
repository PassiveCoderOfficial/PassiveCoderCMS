import type { BlockType } from "@/types/cms";

/**
 * The reorderable / hideable pieces of each block type, in their default
 * order. Keys must match the `parts` passed to orderElements() in that
 * block's component. A type listed here gets the "Elements" editor in the
 * Style panel; add a type once its component renders through orderElements.
 */
/** `fixed`: the piece sits in its own spot in the layout (e.g. a button column
 *  beside the text), so it can be hidden but not moved. */
export type BlockElementDef = { key: string; label: string; fixed?: boolean };


// Section header for list-style blocks: hide-only (every layout already skips
// an empty title/subtitle — see applyHiddenElements), so no move arrows.
const SECTION_HEADER: BlockElementDef[] = [
  { key: "title", label: "Section title", fixed: true },
  { key: "subtitle", label: "Section subtitle", fixed: true },
];
const SECTION_TITLE: BlockElementDef[] = [SECTION_HEADER[0]];

export const BLOCK_ELEMENTS: Partial<Record<BlockType, BlockElementDef[]>> = {
  hero: [
    { key: "badge", label: "Badge" },
    { key: "title", label: "Headline" },
    { key: "subtitle", label: "Subtitle" },
    { key: "description", label: "Description" },
    { key: "buttons", label: "Buttons" },
  ],
  cta: [
    { key: "title", label: "Headline" },
    { key: "description", label: "Description" },
    { key: "buttons", label: "Buttons", fixed: true },
  ],
  services: SECTION_HEADER,
  features: SECTION_HEADER,
  testimonials: SECTION_TITLE,
  pricing: SECTION_HEADER,
  faq: SECTION_HEADER,
  team: SECTION_HEADER,
  steps: SECTION_HEADER,
  gallery: SECTION_TITLE,
  icon_grid: SECTION_TITLE,
  stats: SECTION_TITLE,
  blog: SECTION_HEADER,
  timeline: SECTION_TITLE,
};
