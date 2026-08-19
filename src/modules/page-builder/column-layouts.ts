/**
 * Ready-made column splits for the insert picker.
 *
 * A container's columns are widthPct values, so a "layout" here is just those
 * numbers — the shape people actually pick from ("two columns", "sidebar on
 * the right") rather than a percentage they have to type. Divi and Elementor
 * both open with this choice, and it's the step that turns a stack of
 * full-width sections into a real page.
 */
import { generateId } from "@/lib/utils";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { Block, ContainerBlockProps } from "@/types/cms";

export type ColumnLayout = {
  id: string;
  label: string;
  description: string;
  /** Column widths as percentages, summing to 100. */
  widths: number[];
};

export const COLUMN_LAYOUTS: ColumnLayout[] = [
  { id: "full",       label: "Full width",   description: "One column across the page.",            widths: [100] },
  { id: "half",       label: "Two equal",    description: "Side by side, even split.",              widths: [50, 50] },
  { id: "thirds",     label: "Three equal",  description: "Three even columns.",                    widths: [33, 34, 33] },
  { id: "quarters",   label: "Four equal",   description: "Four even columns.",                     widths: [25, 25, 25, 25] },
  { id: "main-side",  label: "Main + side",  description: "Wide left, narrow right — text and a sidebar.", widths: [70, 30] },
  { id: "side-main",  label: "Side + main",  description: "Narrow left, wide right.",               widths: [30, 70] },
  { id: "wide-thin",  label: "Two thirds",   description: "Two thirds beside one third.",           widths: [66, 34] },
  { id: "center-wide",label: "Narrow sides", description: "A wide middle between two narrow edges.", widths: [25, 50, 25] },
];

/** Builds a container block pre-split to this layout. */
export function createColumnLayout(layout: ColumnLayout): Block {
  const base = createBlock("container") as ContainerBlockProps | undefined;
  if (!base) throw new Error("container block is missing from the registry");

  return {
    ...base,
    data: {
      ...base.data,
      columns: layout.widths.map((widthPct) => ({ id: generateId(), widthPct, blocks: [] })),
    },
  } as Block;
}
