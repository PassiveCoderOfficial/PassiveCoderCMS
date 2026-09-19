"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import type { CustomHtmlBlockProps } from "@/types/cms";

/** Custom HTML had no settings panel at all — a block whose entire purpose
 *  is arbitrary markup had no way to actually type any in. Found in the
 *  full block-editor audit. */
export function CustomHtmlSettings({ block }: { block: CustomHtmlBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-2.5 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Renders exactly as written, unsanitized. Only paste code from a source you trust.</span>
      </div>
      <div>
        <Label className="text-xs">HTML</Label>
        <Textarea
          value={block.data.html}
          onChange={(e) => update("html", e.target.value)}
          className="text-xs font-mono min-h-32 mt-1"
          placeholder="<div>Your markup here</div>"
          spellCheck={false}
        />
      </div>
      <div>
        <Label className="text-xs">CSS (optional)</Label>
        <Textarea
          value={block.data.css ?? ""}
          onChange={(e) => update("css", e.target.value)}
          className="text-xs font-mono min-h-24 mt-1"
          placeholder=".my-class { color: red; }"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
