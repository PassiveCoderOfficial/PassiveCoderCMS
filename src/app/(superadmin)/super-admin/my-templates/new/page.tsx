import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor } from "@/modules/templates/permissions";
import NewTemplateClient from "./new-template-client";
import type { TemplateCategory } from "@/modules/templates/types";

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const author = await requireTemplateAuthor();
  if (!author) redirect("/super-admin");

  const { from } = await searchParams;
  const admin = await createAdminClient();

  const [{ data: categories }, tenantResult] = await Promise.all([
    admin.from("template_categories").select("*").eq("status", "active").order("sort_order", { ascending: true }),
    // `?from=<tenantId>` arrives from a site's "Save as Template" action —
    // the form then offers to snapshot that site instead of starting blank.
    from
      ? admin.from("tenants").select("id, name, slug").eq("id", from).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const sourceTenant = tenantResult.data as { id: string; name: string; slug: string } | null;

  return (
    <NewTemplateClient
      categories={(categories ?? []) as TemplateCategory[]}
      sourceTenant={sourceTenant}
      isSuperAdmin={author.isSuperAdmin}
    />
  );
}
