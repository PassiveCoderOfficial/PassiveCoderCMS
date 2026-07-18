"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

interface PageActionsProps {
  pageId: string;
  pageSlug: string;
}

export function PageActions({ pageId, pageSlug }: PageActionsProps) {
  const router = useRouter();

  const handleDuplicate = async () => {
    const supabase = createClient();
    const { data: page } = await supabase.from("pages").select("*").eq("id", pageId).single();
    if (!page) return;
    const newSlug = `${page.slug}-copy-${generateId(4)}`;
    const { error } = await supabase.from("pages").insert({ ...page, id: undefined, title: `${page.title} (Copy)`, slug: newSlug, status: "draft", created_at: undefined, updated_at: undefined });
    if (error) { toast.error("Failed to duplicate page"); return; }
    toast.success("Page duplicated");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("pages").delete().eq("id", pageId);
    if (error) { toast.error("Failed to delete page"); return; }
    toast.success("Page deleted");
    router.refresh();
  };

  // stopPropagation: the parent row is itself a click target that navigates to
  // the editor, so these buttons must not also trigger that row-level handler.
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
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
