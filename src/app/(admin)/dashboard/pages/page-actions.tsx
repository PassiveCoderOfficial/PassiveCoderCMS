"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Copy, Trash2, RotateCcw, XCircle } from "lucide-react";
import { moveToTrash, restoreFromTrash, deletePermanently, duplicatePage } from "./content-status";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/language-provider";

interface PageActionsProps {
  pageId: string;
  pageSlug: string;
  inTrash?: boolean;
}

export function PageActions({ pageId, pageSlug, inTrash }: PageActionsProps) {
  const router = useRouter();
  const t = useT();

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
      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pages.actionEdit")} onClick={() => router.push(`/dashboard/pages/${pageId}`)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("pages.actionView")} onClick={() => window.open(`/${pageSlug}`, "_blank")}>
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
