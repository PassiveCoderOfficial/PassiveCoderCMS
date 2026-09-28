import { Fragment, type ReactNode } from "react";
import type { BlockElements } from "@/types/cms";

/**
 * Renders a block's pieces (badge, title, subtitle, buttons…) in the order the
 * editor chose, skipping hidden ones. `parts` is given in the variant's
 * default order, so a block with no `elements` setting renders exactly as the
 * variant was designed. Keys missing from a saved order (e.g. a piece added to
 * a block type later) keep their default position after the ordered ones.
 */
export function orderElements(layout: BlockElements | undefined, parts: Record<string, ReactNode>): ReactNode[] {
  const keys = Object.keys(parts);
  const saved = (layout?.order ?? []).filter((k) => keys.includes(k));
  const order = [...saved, ...keys.filter((k) => !saved.includes(k))];
  const hidden = new Set(layout?.hidden ?? []);
  return order.filter((k) => !hidden.has(k)).map((k) => <Fragment key={k}>{parts[k]}</Fragment>);
}
