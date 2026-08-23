import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor } from "@/modules/templates/permissions";
import MyTemplatesClient from "@/app/(superadmin)/super-admin/my-templates/my-templates-client";
import type { SiteTemplate, TemplateCategory } from "@/modules/templates/types";

// Staff-facing mirror of /super-admin/my-templates — same client component,
// same requireTemplateAuthor() gate (which already scopes staff to their own
// templates), just reachable from the (staff) layout's lighter requireStaff()
// gate instead of the (superadmin) layout's manager-or-SA-only one. That gate
// mismatch was the actual bug: this page's own query logic always supported
// staff authors, but ordinary (non-manager) staff could never reach the route
// at all.
export default async function StaffMyTemplatesPage() {
  const author = await requireTemplateAuthor();
  if (!author) redirect("/staff");

  const admin = await createAdminClient();

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
      basePath="/staff/my-templates"
    />
  );
}
