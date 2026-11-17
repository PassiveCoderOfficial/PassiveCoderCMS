"use client";

/**
 * "Words on this section": one box per built-in text of a block (button
 * labels, form placeholders, empty-state lines...), listed in
 * modules/page-builder/ui-text.ts. The built-in text shows in grey; typing
 * replaces it on this block only, clearing the box brings it back. Boxes that
 * the block's current layout or toggles do not draw are left out.
 */
import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { uiTextDefs, uiTextDefault, type UiTextDef } from "@/modules/page-builder/ui-text";
import type { Block } from "@/types/cms";
import { LinesField, TextField } from "./showcase-fields";

export function UiTextFields({ block, title = "Words on this section", only, open }: {
  block: Block;
  title?: string;
  /** Limit to these keys (a panel that shows some of them elsewhere). */
  only?: string[];
  /** Start expanded (default: expanded when there are only a few boxes). */
  open?: boolean;
}) {
  const { updateBlock } = useBuilderStore();
  const data = (block.data ?? {}) as Record<string, unknown>;
  const defs = uiTextDefs(block.type).filter((d) => (!only || only.includes(d.key)) && (!d.when || d.when(data)));
  if (!defs.length) return null;

  // Read the live block on every edit so two quick edits never overwrite each other.
  const set = (key: string, value: string | string[] | undefined) => {
    const current = (useBuilderStore.getState().getBlock(block.id)?.data ?? block.data) as Record<string, unknown>;
    const next = { ...current };
    if (value === undefined || (Array.isArray(value) ? value.length === 0 : value === "")) delete next[key];
    else next[key] = value;
    updateBlock(block.id, { data: next } as Partial<Block>);
  };

  const sections: { name: string; defs: UiTextDef[] }[] = [];
  for (const d of defs) {
    const name = d.section ?? "";
    const s = sections.find((x) => x.name === name);
    if (s) s.defs.push(d); else sections.push({ name, defs: [d] });
  }

  return (
    <details className="group rounded-lg border bg-muted/20 p-2.5" open={open ?? defs.length <= 4}>
      <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase text-muted-foreground">
        {title} ({defs.length})
      </summary>
      <div className="mt-2 space-y-3">
        <p className="text-[10px] text-muted-foreground">Leave a box empty to keep the text shown in grey.</p>
        {sections.map((s) => (
          <div key={s.name || "_"} className="space-y-2">
            {s.name && <p className="text-[10px] font-semibold text-muted-foreground border-t pt-2">{s.name}</p>}
            {s.defs.map((d) => {
              const hint = [d.note, d.hideable ? "Type - to hide this line." : ""].filter(Boolean).join(" ") || undefined;
              if (d.lines) {
                const v = data[d.key];
                return (
                  <LinesField key={d.key} label={d.label} rows={Math.min(6, Math.max(3, d.lines.length))}
                    value={Array.isArray(v) && v.length ? (v as string[]) : [...d.lines]}
                    hint={`One per line.${hint ? ` ${hint}` : ""}`}
                    onChange={(lines) => set(d.key, lines.join("\n") === d.lines!.join("\n") ? undefined : lines)} />
                );
              }
              return (
                <TextField key={d.key} label={d.label} value={typeof data[d.key] === "string" ? (data[d.key] as string) : ""}
                  placeholder={uiTextDefault(d, data)} hint={hint} multiline={d.multiline}
                  onChange={(v) => set(d.key, v)} />
              );
            })}
          </div>
        ))}
      </div>
    </details>
  );
}
