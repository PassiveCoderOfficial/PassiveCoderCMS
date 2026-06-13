"use client";

import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

/**
 * Inline editing for block text. Inside the page builder the canvas provides
 * this context, which turns matching text elements into click-to-type fields.
 * On the public site there is no provider, so text renders as plain markup.
 */

export interface InlineEditContextValue {
  /** Update a single field inside a block's `data` object. */
  updateField: (blockId: string, field: string, value: string) => void;
}

export const InlineEditContext = createContext<InlineEditContextValue | null>(null);

interface InlineTextProps {
  blockId: string;
  /** Field name inside block.data (supports one level of nesting via "a.b"). */
  field: string;
  value: string | undefined;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

export function InlineText({ blockId, field, value, as = "span", className, style }: InlineTextProps) {
  const ctx = useContext(InlineEditContext);
  const Tag = as as React.ElementType;

  if (!ctx) {
    if (!value) return null;
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  return (
    <Tag
      className={cn(
        className,
        "cursor-text outline-none rounded-sm transition-shadow",
        "hover:ring-1 hover:ring-blue-400/60 focus:ring-2 focus:ring-blue-500/80 focus:bg-blue-50/10",
        !value && "min-w-[60px] inline-block opacity-50",
      )}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      title="Click to edit"
      onClick={(e: React.MouseEvent) => {
        // Keep the block selected, don't trigger links/navigation while editing
        e.stopPropagation();
        e.preventDefault();
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") {
          (e.currentTarget as HTMLElement).textContent = value ?? "";
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.textContent ?? "";
        if (next !== (value ?? "")) ctx.updateField(blockId, field, next);
      }}
      dangerouslySetInnerHTML={{ __html: escapeHtml(value ?? "") }}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
