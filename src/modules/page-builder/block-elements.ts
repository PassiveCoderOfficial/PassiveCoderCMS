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
};
