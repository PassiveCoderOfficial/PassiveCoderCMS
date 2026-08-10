import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { DEFAULT_PALETTE } from "@/modules/themes/default-palette";
import type { TemplatePalette } from "@/modules/themes/template-types";
import { ColorsClient } from "./colors-client";

export default async function ColorsDesignPage() {
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  let templateId: string | null = null;
  let colorOverrides: Partial<TemplatePalette> | null = null;

  if (tenantId) {
    const admin = await createAdminClient();
    const { data } = await admin
      .from("site_identity")
      .select("template_id, color_overrides")
      .eq("tenant_id", tenantId)
      .single();
    templateId = (data as { template_id?: string | null } | null)?.template_id ?? null;
    colorOverrides = (data as { color_overrides?: Partial<TemplatePalette> } | null)?.color_overrides ?? null;
  }

  // The palette being customised is the active template's. A site with no
  // template yet still gets a usable editor, layered over neutral defaults.
  const templateIdentity = templateId ? await resolveDbTemplateIdentity(templateId) : null;
  const basePalette = templateIdentity?.palette ?? DEFAULT_PALETTE;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Colors &amp; Design</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Site-wide color tokens, layered over your active template. Changes apply everywhere on your live site.
        </p>
      </div>
      <ColorsClient basePalette={basePalette} overrides={colorOverrides ?? {}} />
    </div>
  );
}
