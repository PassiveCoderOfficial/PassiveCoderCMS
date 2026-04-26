import React from "react";
import type { TextBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

export function TextBlock({ block }: { block: TextBlockProps }) {
  const { data } = block;
  const { content, alignment, columns, typography } = data;

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
