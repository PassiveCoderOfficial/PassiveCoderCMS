"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useBuilderStore } from "@/lib/store/builder";
import { BuilderCanvas } from "@/components/admin/page-builder/canvas/builder-canvas";
import { BlocksPanel } from "@/components/admin/page-builder/blocks-panel/blocks-panel";
import { HEADER_BLOCK_TYPES, FOOTER_BLOCK_TYPES, HEADER_BLOCK_DISPLAY, FOOTER_BLOCK_DISPLAY } from "@/modules/page-builder/header-blocks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Undo2, Redo2, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";

export type HeaderTarget = "header" | "footer";

/**
 * Header/footer builder — the ordinary page builder pointed at
 * site_identity.global_header (or global_footer) instead of a page's blocks.
 *
 * The global header has always been stored as Block[], so the canvas, block
 * palette, variant picker and settings panels all work here unchanged; only
 * the load and save targets differ. The palette is restricted to blocks that
 * make sense in site chrome — see header-blocks.ts.
 */
export default function HeaderBuilderClient({
  target,
  initialBlocks,
  tenantId,
}: {
  target: HeaderTarget;
  initialBlocks: Block[];
  tenantId: string;
}) {
  const { blocks, isDirty, setBlocks, setTenantId, setDirty, undo, redo, canUndo, canRedo } = useBuilderStore();
  const [saving, setSaving] = useState(false);
  const [showBlocks, setShowBlocks] = useState(true);
  const savingRef = useRef(false);

  useEffect(() => {
    // No pageId — this isn't a page. Settings panels that need tenant context
    // (products, bookings) still work because the tenant is set.
    setTenantId(tenantId);
    setBlocks(initialBlocks);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const handleSave = useCallback(async (auto = false) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const current = useBuilderStore.getState().blocks;
    try {
      const res = await fetch("/api/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "global_layout",
          [target === "header" ? "global_header" : "global_footer"]: current,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      if (useBuilderStore.getState().blocks === current) setDirty(false);
      if (!auto) toast.success(`${target === "header" ? "Header" : "Footer"} saved — live on every page`);
    } catch {
      toast.error("Failed to save — your changes are still here, try again");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [target, setDirty]);

  // Autosave 2.5s after the last change, matching the page builder so the two
  // don't behave differently for no reason.
  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => void handleSave(true), 2500);
    return () => clearTimeout(t);
  }, [blocks, isDirty, handleSave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "s") { e.preventDefault(); void handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const label = target === "header" ? "Header" : "Footer";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b bg-background px-3 py-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard/navigation"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <Button
          variant="ghost" size="icon"
          className={cn("h-8 w-8", !showBlocks && "text-muted-foreground")}
          onClick={() => setShowBlocks(!showBlocks)}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="ml-1">
          <p className="text-sm font-semibold leading-tight">Site {label}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Shown on every page of your site
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo()}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo()}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {saving ? "Saving…" : isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isDirty} className="h-8 gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showBlocks && (
          <div className="flex w-64 shrink-0 flex-col overflow-hidden border-r">
            <BlocksPanel
              initialTab="blocks"
              allowedBlockTypes={target === "header" ? HEADER_BLOCK_TYPES : FOOTER_BLOCK_TYPES}
              blockDisplayOverrides={target === "header" ? HEADER_BLOCK_DISPLAY : FOOTER_BLOCK_DISPLAY}
            />
          </div>
        )}

        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          {/* A header is a strip, not a page. min-h-full previously forced this
              wrapper to fill the viewport height, which left a large dead grey
              area below the actual header content — sized to content instead,
              with just enough top padding to keep it from touching the edge. */}
          <div className="py-6">
            <div className="mx-auto max-w-[1400px] bg-card shadow-sm">
              <BuilderCanvas />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              This {label.toLowerCase()} appears on every page. Changes save automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
