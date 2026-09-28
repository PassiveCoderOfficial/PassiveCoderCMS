import type { BlockType } from "@/types/cms";

/**
 * The reorderable / hideable pieces of each block type, in their default
 * order. Keys must match the `parts` passed to orderElements() in that
 * block's component. A type listed here gets the "Elements" editor in the
 * Style panel; add a type once its component renders through orderElements.
 */
export const BLOCK_ELEMENTS: Partial<Record<BlockType, { key: string; label: string }[]>> = {
  hero: [
    { key: "badge", label: "Badge" },
    { key: "title", label: "Headline" },
    { key: "subtitle", label: "Subtitle" },
    { key: "description", label: "Description" },
    { key: "buttons", label: "Buttons" },
  ],
};
