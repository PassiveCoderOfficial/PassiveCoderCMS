import React from "react";
import type { TextBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

export function TextBlock({ block }: { block: TextBlockProps }) {
  const { data } = block;
  const { content, alignment, columns } = data;
  // typography is typed as always present, but real content written before
  // this field existed (or by any path that omits it) reaches here as
  // undefined — reading .color off it crashed the WHOLE editor with no
  // recovery, the same failure shape padding/margin had before (see
  // block-renderer.tsx). 5 real pages have a text block missing this today.
  const typography = data.typography ?? {};

  const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[alignment] ?? "text-left";
  const colClass = { 1: "", 2: "md:columns-2", 3: "md:columns-3" }[columns] ?? "";

  return (
    <div className="max-w-5xl mx-auto">
      <div
        className={cn("prose prose-lg max-w-none", alignClass, colClass)}
        style={{ color: typography.color, fontSize: typography.fontSize, fontFamily: typography.fontFamily, lineHeight: typography.lineHeight }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
