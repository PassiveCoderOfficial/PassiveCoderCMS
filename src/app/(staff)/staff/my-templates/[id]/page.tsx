import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor } from "@/modules/templates/permissions";
import TemplateDetailClient from "@/app/(superadmin)/super-admin/my-templates/[id]/template-detail-client";
import type { SiteTemplate, TemplateCategory } from "@/modules/templates/types";

export default async function StaffTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await requireTemplateAuthor();
  if (!author) redirect("/staff");

  const admin = await createAdminClient();
  const { data: template } = await admin.from("templates").select("*").eq("id", id).maybeSingle();
  if (!template) notFound();
  if (!author.isSuperAdmin && template.owner_id !== author.user.id) notFound();

  const [{ data: pages }, { data: categories }] = await Promise.all([
    admin
      .from("pages")
      .select("id, title, slug, status, order_index, updated_at")
      .eq("template_id", id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
    admin.from("template_categories").select("*").eq("status", "active").order("sort_order", { ascending: true }),
  ]);

  return (
    <TemplateDetailClient
      template={template as SiteTemplate}
      pages={pages ?? []}
      categories={(categories ?? []) as TemplateCategory[]}
      basePath="/staff/my-templates"
    />
  );
}
