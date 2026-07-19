import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { getDefaultTemplateIdentity, getTemplateIdentity, type TemplatePalette } from "@/modules/themes/template-registry";
import { ColorsClient } from "./colors-client";

export default async function ColorsDesignPage() {
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  let activeTemplateSlug: string | null = null;
  let colorOverrides: Partial<TemplatePalette> | null = null;

  if (tenantId) {
    const admin = await createAdminClient();
    const { data } = await admin
      .from("site_identity")
      .select("active_template_slug, color_overrides")
      .eq("tenant_id", tenantId)
      .single();
    activeTemplateSlug = (data as { active_template_slug?: string } | null)?.active_template_slug ?? null;
    colorOverrides = (data as { color_overrides?: Partial<TemplatePalette> } | null)?.color_overrides ?? null;
  }

  const templateIdentity = activeTemplateSlug ? getTemplateIdentity(activeTemplateSlug) : null;
  const basePalette = (templateIdentity ?? getDefaultTemplateIdentity()).palette;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Colors & Design</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Site-wide color tokens, layered over your active template
          {templateIdentity ? ` (${templateIdentity.name})` : ""}. Changes apply everywhere on your live site.
        </p>
      </div>
      <ColorsClient basePalette={basePalette} overrides={colorOverrides ?? {}} />
    </div>
  );
}
