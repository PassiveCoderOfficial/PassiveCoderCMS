import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor } from "@/modules/templates/permissions";
import NewTemplateClient from "@/app/(superadmin)/super-admin/my-templates/new/new-template-client";
import type { TemplateCategory } from "@/modules/templates/types";

export default async function StaffNewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const author = await requireTemplateAuthor();
  if (!author) redirect("/staff");

  const { from } = await searchParams;
  const admin = await createAdminClient();

  // assigned_staff_id/referred_by_staff_id store pc_staff.id, not the auth
  // user id — same distinction getCurrentTenantId() already has to make.
  let staffRowId: string | null = null;
  if (!author.isSuperAdmin) {
    const { data: staffRow } = await admin.from("pc_staff").select("id").eq("user_id", author.user.id).maybeSingle();
    staffRowId = staffRow?.id ?? null;
  }

  const [{ data: categories }, tenantResult] = await Promise.all([
    admin.from("template_categories").select("*").eq("status", "active").order("sort_order", { ascending: true }),
    // `?from=<tenantId>` arrives from a site's "Save as Template" action —
    // for staff this is scoped to sites they're actually assigned/referred
    // to or own, same as every other staff-facing tenant lookup.
    from && (author.isSuperAdmin || staffRowId)
      ? admin
          .from("tenants")
          .select("id, name, slug")
          .eq("id", from)
          .or(
            author.isSuperAdmin
              ? "id.not.is.null"
              : `assigned_staff_id.eq.${staffRowId},referred_by_staff_id.eq.${staffRowId},owner_id.eq.${author.user.id}`,
          )
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const sourceTenant = tenantResult.data as { id: string; name: string; slug: string } | null;

  return (
    <NewTemplateClient
      categories={(categories ?? []) as TemplateCategory[]}
      sourceTenant={sourceTenant}
      isSuperAdmin={author.isSuperAdmin}
      basePath="/staff/my-templates"
    />
  );
}
