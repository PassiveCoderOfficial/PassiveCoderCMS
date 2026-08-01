import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor } from "@/modules/templates/permissions";
import MyTemplatesClient from "./my-templates-client";
import type { SiteTemplate, TemplateCategory } from "@/modules/templates/types";

export default async function MyTemplatesPage() {
  const author = await requireTemplateAuthor();
  if (!author) redirect("/super-admin");

  const admin = await createAdminClient();

  // Staff see their own; super admins see everything authored through this
  // engine — the 54 legacy catalog rows (owner_id null) are deliberately
  // excluded, they belong to the old registry path until Phase 3.
  let query = admin
    .from("templates")
    .select("*")
    .not("owner_id", "is", null)
    .order("updated_at", { ascending: false });
  if (!author.isSuperAdmin) query = query.eq("owner_id", author.user.id);

  const [{ data: templates }, { data: categories }] = await Promise.all([
    query,
    admin.from("template_categories").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <MyTemplatesClient
      templates={(templates ?? []) as SiteTemplate[]}
      categories={(categories ?? []) as TemplateCategory[]}
      isSuperAdmin={author.isSuperAdmin}
    />
  );
}
