"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { toast } from "sonner";
import { useBuilderStore } from "@/lib/store/builder";
import { BuilderCanvas } from "@/components/admin/page-builder/canvas/builder-canvas";
import { BlocksPanel } from "@/components/admin/page-builder/blocks-panel/blocks-panel";
import { HEADER_BLOCK_TYPES, FOOTER_BLOCK_TYPES, HEADER_BLOCK_DISPLAY, FOOTER_BLOCK_DISPLAY } from "@/modules/page-builder/header-blocks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Undo2, Redo2, PanelLeft, CornerUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";
import { useT } from "@/lib/i18n/language-provider";

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
  returnTo,
}: {
  target: HeaderTarget;
  initialBlocks: Block[];
  tenantId: string;
  /** Page editor to return to, when the user arrived from one. Already
   *  validated server-side; null when they came in via the normal nav. */
  returnTo?: string | null;
}) {
  const t = useT();
  const { blocks, isDirty, setBlocks, setTenantId, setDirty, undo, redo, canUndo, canRedo } = useBuilderStore();
  const [saving, setSaving] = useState(false);
  const [showBlocks, setShowBlocks] = useState(true);
  const savingRef = useRef(false);
  const router = useRouter();
  // Shown once a manual save succeeds while in round-trip mode, so the user is
  // offered the way back at the moment their work is safely stored rather than
  // having to notice a button.
  const [offerReturn, setOfferReturn] = useState(false);

  useEffect(() => {
    // No pageId — this isn't a page. Settings panels that need tenant context
    // (products, bookings) still work because the tenant is set.
    setTenantId(tenantId);
    setBlocks(initialBlocks, true);
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
      if (!auto) {
        toast.success(t("headerBuilder.savedLive", { label: target === "header" ? t("headerBuilder.header") : t("headerBuilder.footer") }));
        if (returnTo) setOfferReturn(true);
      }
    } catch {
      toast.error(t("headerBuilder.saveFailed"));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [target, setDirty, returnTo, t]);

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

  const label = target === "header" ? t("headerBuilder.header") : t("headerBuilder.footer");

  // Overlay headers (nav scrollAware / transparent) draw light text and no
  // background of their own, expecting a dark hero underneath. Previewed on
  // the usual white canvas they are white-on-white. Only those need the dark
  // ground — a solid header or a footer paints its own and looks wrong on it.
  const previewOnDark = blocks.some(b =>
    b.type === "navigation" &&
    Boolean((b.data as { scrollAware?: boolean; transparent?: boolean } | undefined)?.scrollAware
      ?? (b.data as { transparent?: boolean } | undefined)?.transparent),
  );

  /** Leaves for the page the user came from, saving first when needed so the
   *  round trip can never silently drop header edits. */
  async function returnToPage() {
    if (!returnTo) return;
    if (useBuilderStore.getState().isDirty) await handleSave();
    router.push(returnTo);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Round-trip context bar. Always visible while in this mode, so the way
          back does not depend on the user having just saved or noticing the
          toast — this is the whole reason they left their page. */}
      {returnTo && (
        <div className="flex items-center gap-2 border-b bg-primary/5 px-3 py-1.5 shrink-0">
          <CornerUpLeft className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground min-w-0 truncate">
            {t("headerBuilder.editingSite", { label: label.toLowerCase() })}
          </p>
          <Button
            size="sm" variant="outline"
            className="ml-auto h-6 text-[11px] gap-1 shrink-0"
            onClick={() => void returnToPage()}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {isDirty || saving ? t("headerBuilder.saveAndReturn") : t("headerBuilder.returnToPage")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b bg-background px-3 py-2 shrink-0">
        <Button
          variant="ghost" size="icon" className="h-8 w-8" asChild
          title={returnTo ? t("headerBuilder.backToPage") : t("headerBuilder.backToNavigation")}
        >
          <Link href={returnTo ?? "/dashboard/navigation"}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <Button
          variant="ghost" size="icon"
          className={cn("h-8 w-8", !showBlocks && "text-muted-foreground")}
          onClick={() => setShowBlocks(!showBlocks)}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="ml-1">
          <p className="text-sm font-semibold leading-tight">{t("headerBuilder.siteLabel", { label })}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {t("headerBuilder.shownOnEveryPage")}
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
            {saving ? t("headerBuilder.saving") : isDirty ? t("headerBuilder.unsavedChanges") : t("headerBuilder.allChangesSaved")}
          </span>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isDirty} className="h-8 gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? t("headerBuilder.saving") : t("headerBuilder.save")}
          </Button>
        </div>
      </div>

      <AlertDialog open={offerReturn} onOpenChange={setOfferReturn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("headerBuilder.labelSaved", { label })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("headerBuilder.liveOnEveryPage", { label: label.toLowerCase() })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("headerBuilder.stayHere")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => returnTo && router.push(returnTo)}>
              {t("headerBuilder.returnToPage")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {/* Overlay headers (the nav's scroll-aware mode) are designed to
                sit transparent over a dark hero and render light text with no
                background of their own. On the builder's white canvas that is
                white-on-white and effectively invisible, so the preview stands
                on a neutral dark ground — approximating the hero the header
                actually overlays, rather than a surface it was never drawn
                for. Solid headers paint their own background over this. */}
            <div className="mx-auto max-w-[1400px] shadow-sm cms-canvas-light">
              <BuilderCanvas surfaceClassName={previewOnDark ? "bg-neutral-800" : "bg-card"} />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t("headerBuilder.appearsOnEveryPage", { label: label.toLowerCase() })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
