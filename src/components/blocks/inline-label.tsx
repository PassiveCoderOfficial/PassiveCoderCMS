"use client";

import React, { useContext } from "react";
import { InlineEditContext, InlineText } from "./inline-text";

/**
 * Click-to-type for text that sits directly inside another element (button
 * labels, small captions, card labels). Unlike InlineText, the public site
 * gets the bare text with no wrapper element, so blocks that printed a plain
 * string before keep exactly the same markup. Inside the page builder it is
 * an InlineText span. `field` is a block.data key, one level of nesting
 * allowed ("primaryButton.label").
 */
export function InlineLabel({ blockId, field, value }: { blockId?: string; field: string; value: string | undefined }) {
  const ctx = useContext(InlineEditContext);
  if (!ctx || !blockId) return <>{value}</>;
  return <InlineText blockId={blockId} field={field} value={value} />;
}
