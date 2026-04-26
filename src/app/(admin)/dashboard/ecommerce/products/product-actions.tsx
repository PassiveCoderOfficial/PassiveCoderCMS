"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";

export function ProductActions({ productId }: { productId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Product deleted");
    router.refresh();
  };

  const handleDuplicate = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("products").select("*").eq("id", productId).single();
    if (!data) return;
    const { error } = await supabase.from("products").insert({ ...data, id: undefined, name: `${data.name} (Copy)`, slug: `${data.slug}-copy-${generateId(4)}`, status: "draft" });
    if (error) { toast.error("Failed to duplicate"); return; }
    toast.success("Product duplicated");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/ecommerce/products/${productId}`)}>
          <Edit className="h-4 w-4 mr-2" /> Edit
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
