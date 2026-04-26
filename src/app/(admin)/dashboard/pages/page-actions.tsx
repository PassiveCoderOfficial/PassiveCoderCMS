"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Eye, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateId, createSlug } from "@/lib/utils";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/pages/${pageId}`)}>
          <Edit className="h-4 w-4 mr-2" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(`/${pageSlug}`, "_blank")}>
          <Eye className="h-4 w-4 mr-2" /> View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
