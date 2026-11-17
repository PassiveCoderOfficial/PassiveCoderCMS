"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";

export function ProductActions({ productId }: { productId: string }) {
  const router = useRouter();
  const t = useT();

  const handleDelete = async () => {
    if (!confirm(t("products.confirmDelete"))) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) { toast.error(t("products.failedToDelete")); return; }
    toast.success(t("products.productDeleted"));
    router.refresh();
  };

  const handleDuplicate = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("products").select("*").eq("id", productId).single();
    if (!data) return;
    // "(Copy)" stays English always — it becomes part of the stored
    // product's name/slug (data, not UI chrome), and a Bangla suffix in a
    // URL slug would be messy regardless of the admin's display language.
    const { error } = await supabase.from("products").insert({ ...data, id: undefined, name: `${data.name} (Copy)`, slug: `${data.slug}-copy-${generateId(4)}`, status: "draft" });
    if (error) { toast.error(t("products.failedToDuplicate")); return; }
    toast.success(t("products.duplicated"));
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/ecommerce/products/${productId}`)}>
          <Edit className="h-4 w-4 mr-2" /> {t("products.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" /> {t("products.duplicate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> {t("products.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
