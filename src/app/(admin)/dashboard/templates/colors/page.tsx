import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { DEFAULT_PALETTE, DEFAULT_TYPOGRAPHY } from "@/modules/themes/default-palette";
import type { SiteDesign, TemplatePalette } from "@/modules/themes/template-types";
import { ColorsClient } from "./colors-client";
import { DesignClient } from "./design-client";

export default async function ColorsDesignPage() {
  // Resolved the same way every other dashboard page does — the x-tenant-id
  // header is only set on a tenant subdomain, so reading it directly left this
  // editor blank whenever the dashboard was reached from the root domain.
  const tenantId = await getCurrentTenantId();

  let templateId: string | null = null;
  let colorOverrides: Partial<TemplatePalette> | null = null;
  let designOverrides: SiteDesign | null = null;

  if (tenantId) {
    const admin = await createAdminClient();
    const { data } = await admin
      .from("site_identity")
      .select("template_id, color_overrides, design_overrides")
      .eq("tenant_id", tenantId)
      .single();
    templateId = (data as { template_id?: string | null } | null)?.template_id ?? null;
    colorOverrides = (data as { color_overrides?: Partial<TemplatePalette> } | null)?.color_overrides ?? null;
    designOverrides = (data as { design_overrides?: SiteDesign | null } | null)?.design_overrides ?? null;
  }

  // The palette being customised is the active template's. A site with no
  // template yet still gets a usable editor, layered over neutral defaults.
  const templateIdentity = templateId ? await resolveDbTemplateIdentity(templateId) : null;
  const basePalette = templateIdentity?.palette ?? DEFAULT_PALETTE;
  const baseTypography = templateIdentity?.typography ?? DEFAULT_TYPOGRAPHY;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Colors &amp; Design</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Site-wide color tokens, layered over your active template. Changes apply everywhere on your live site.
        </p>
      </div>
      <ColorsClient basePalette={basePalette} overrides={colorOverrides ?? {}} tenantId={tenantId} />

      <div className="mt-10 mb-6">
        <h2 className="text-xl font-bold">Fonts &amp; Style</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Typography, corners and shadows for every page and block on your site.
        </p>
      </div>
      <DesignClient
        initial={designOverrides ?? {}}
        typography={baseTypography}
        palette={{ ...basePalette, ...(colorOverrides ?? {}) }}
        tenantId={tenantId}
      />
    </div>
  );
}
