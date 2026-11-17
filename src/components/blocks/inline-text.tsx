"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
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
  const ref = useRef<HTMLElement>(null);
  // Tracks whether the element's own DOM content is still in sync with the
  // `value` prop, so a re-render never has to choose between "overwrite
  // whatever the user is mid-typing" and "never pick up an external update".
  const lastSyncedValue = useRef(value);

  // contentEditable owns its own DOM once mounted — every keystroke edits the
  // live node directly, with nothing telling React about it until onBlur
  // commits `value`. `dangerouslySetInnerHTML` doesn't know that: it re-runs
  // on *every* render this component receives, including ones caused by
  // something unrelated (a sibling block edit, autosave, selection change),
  // and each time stamps the DOM back to the last-committed `value` — which
  // is not what's currently on screen while the user is typing. That silently
  // discarded keystrokes the moment any other state in the builder changed.
  // Setting textContent imperatively, only when `value` actually changes
  // (i.e. an external update, not a re-render echoing back what's already
  // there), keeps the element uncontrolled the rest of the time.
  useEffect(() => {
    const el = ref.current;
    if (!el || value === lastSyncedValue.current) return;
    // Never stomp on an active edit — the user's keystrokes are the source of
    // truth until they blur, at which point `value` catches up on its own.
    if (document.activeElement === el) return;
    el.textContent = value ?? "";
    lastSyncedValue.current = value;
  }, [value]);

  if (!ctx) {
    if (!value) return null;
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref}
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
        lastSyncedValue.current = next;
        if (next !== (value ?? "")) ctx.updateField(blockId, field, next);
      }}
      suppressHydrationWarning
    >
      {value ?? ""}
    </Tag>
  );
}
