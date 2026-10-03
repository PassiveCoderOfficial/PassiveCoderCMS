"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Copy, Trash2, RotateCcw, XCircle, Sparkles, Undo2, Loader2 } from "lucide-react";
import { moveToTrash, restoreFromTrash, deletePermanently, duplicatePage } from "./content-status";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/language-provider";

interface PageActionsProps {
  pageId: string;
  /** Full public URL of the page on the site's real domain. */
  viewUrl: string;
  inTrash?: boolean;
  /** Imported pages get "Rebuild with AI" (and "Restore original" after). */
  imported?: "imported" | "rebuilt";
}

export function PageActions({ pageId, viewUrl, inTrash, imported }: PageActionsProps) {
  const router = useRouter();
  const t = useT();
  const [rebuilding, setRebuilding] = React.useState(false);

  const handleRebuild = async (restore = false) => {
    if (!confirm(restore ? t("pages.confirmRestoreImported") : t("pages.confirmRebuildAi"))) return;
    setRebuilding(true);
    const id = toast.loading(restore ? t("pages.restoringImported") : t("pages.rebuildingAi"));
    try {
      const res = await fetch("/api/aicoder/rebuild-imported", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId, restore }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast.success(restore ? t("pages.restoredImported") : t("pages.rebuiltAi"), { id });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed", { id });
    } finally {
      setRebuilding(false);
    }
  };

  const handleDuplicate = async () => {
    const { error } = await duplicatePage(pageId);
    if (error) { toast.error(t("pages.failedDuplicate")); return; }
    toast.success(t("pages.duplicated"));
    router.refresh();
  };

  const handleTrash = async () => {
    if (!confirm(t("pages.confirmMoveToTrash"))) return;
    const { error } = await moveToTrash(pageId);
    if (error) { toast.error(t("pages.failedMoveToTrash")); return; }
    toast.success(t("pages.movedToTrash"));
    router.refresh();
  };

  const handleRestore = async () => {
    const { error } = await restoreFromTrash(pageId);
    if (error) { toast.error(t("pages.failedRestore")); return; }
    toast.success(t("pages.restored"));
    router.refresh();
  };

  const handleDeleteForever = async () => {
    if (!confirm(t("pages.confirmDeleteForever"))) return;
    const { error } = await deletePermanently(pageId);
    if (error) { toast.error(t("pages.failedDeleteForever")); return; }
    toast.success(t("pages.deletedForever"));
    router.refresh();
  };

  // stopPropagation: the parent row is itself a click target that navigates to
  // the editor, so these buttons must not also trigger that row-level handler.
  if (inTrash) {
    return (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pages.actionRestore")} onClick={handleRestore}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title={t("pages.actionDeletePermanently")} onClick={handleDeleteForever}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {imported && (
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={rebuilding} onClick={() => handleRebuild(false)} title={t("pages.rebuildAiHint")}>
          {rebuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span className="hidden md:inline">{t("pages.rebuildAi")}</span>
        </Button>
      )}
      {imported === "rebuilt" && (
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={rebuilding} title={t("pages.restoreImported")} onClick={() => handleRebuild(true)}>
          <Undo2 className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pages.actionEdit")} onClick={() => router.push(`/dashboard/pages/${pageId}`)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pages.actionView")} onClick={() => window.open(viewUrl, "_blank")}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pages.actionDuplicate")} onClick={handleDuplicate}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title={t("pages.actionMoveToTrash")} onClick={handleTrash}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
