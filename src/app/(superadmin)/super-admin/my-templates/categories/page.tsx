import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import CategoriesClient from "./categories-client";
import type { TemplateCategory } from "@/modules/templates/types";

export default async function TemplateCategoriesPage() {
  // Categories are global and SA-managed — staff can request one at
  // template-save time but cannot manage the list itself.
  const sa = await requireSuperAdmin();
  if (!sa) redirect("/super-admin");

  const admin = await createAdminClient();
  const [{ data: categories }, { data: counts }] = await Promise.all([
    admin.from("template_categories").select("*").order("sort_order", { ascending: true }),
    admin.from("templates").select("category_id").not("category_id", "is", null),
  ]);

  const usage = new Map<string, number>();
  for (const row of counts ?? []) {
    const id = (row as { category_id: string }).category_id;
    usage.set(id, (usage.get(id) ?? 0) + 1);
  }

  return (
    <CategoriesClient
      categories={(categories ?? []) as TemplateCategory[]}
      usage={Object.fromEntries(usage)}
    />
  );
}
