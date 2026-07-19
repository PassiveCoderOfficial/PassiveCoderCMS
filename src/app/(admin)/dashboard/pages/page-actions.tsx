"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Copy, Trash2, RotateCcw, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateId } from "@/lib/utils";
import { moveToTrash, restoreFromTrash, deletePermanently } from "./content-status";
import { toast } from "sonner";

interface PageActionsProps {
  pageId: string;
  pageSlug: string;
  inTrash?: boolean;
}

export function PageActions({ pageId, pageSlug, inTrash }: PageActionsProps) {
  const router = useRouter();

  const handleDuplicate = async () => {
    const supabase = createClient();
    const { data: page } = await supabase.from("pages").select("*").eq("id", pageId).single();
    if (!page) return;
    const newSlug = `${page.slug}-copy-${generateId(4)}`;
    const { error } = await supabase.from("pages").insert({ ...page, id: undefined, title: `${page.title} (Copy)`, slug: newSlug, status: "draft", deleted_at: null, created_at: undefined, updated_at: undefined });
    if (error) { toast.error("Failed to duplicate page"); return; }
    toast.success("Page duplicated");
    router.refresh();
  };

  const handleTrash = async () => {
    if (!confirm("Move this page to Trash?")) return;
    const { error } = await moveToTrash(pageId);
    if (error) { toast.error("Failed to move to trash"); return; }
    toast.success("Moved to Trash");
    router.refresh();
  };

  const handleRestore = async () => {
    const { error } = await restoreFromTrash(pageId);
    if (error) { toast.error("Failed to restore"); return; }
    toast.success("Restored");
    router.refresh();
  };

  const handleDeleteForever = async () => {
    if (!confirm("Permanently delete this page? This cannot be undone.")) return;
    const { error } = await deletePermanently(pageId);
    if (error) { toast.error("Failed to delete page"); return; }
    toast.success("Page permanently deleted");
    router.refresh();
  };

  // stopPropagation: the parent row is itself a click target that navigates to
  // the editor, so these buttons must not also trigger that row-level handler.
  if (inTrash) {
    return (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Restore" onClick={handleRestore}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete permanently" onClick={handleDeleteForever}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => router.push(`/dashboard/pages/${pageId}`)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => window.open(`/${pageSlug}`, "_blank")}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicate" onClick={handleDuplicate}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Move to Trash" onClick={handleTrash}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
