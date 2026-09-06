import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { toBlocks } from "@/lib/site/global-blocks";
import { safeReturnTo } from "@/lib/site/return-to";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildTemplateCSSVars } from "@/modules/themes/template-css";
import HeaderBuilderClient, { type HeaderTarget } from "./header-builder-client";

export default async function HeaderBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; returnTo?: string }>;
}) {
  const { target: rawTarget, returnTo: rawReturnTo } = await searchParams;
  const target: HeaderTarget = rawTarget === "footer" ? "footer" : "header";
  // Untrusted — comes straight from the URL. See safeReturnTo.
  const returnTo = safeReturnTo(rawReturnTo);

  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No site selected.</p>
      </div>
    );
  }

  const admin = await createAdminClient();
  const { data } = await admin
    .from("site_identity")
    .select("global_header, global_footer, template_id, color_overrides")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const initialBlocks = toBlocks(
    target === "header" ? data?.global_header : data?.global_footer,
  );

  // Same gap the page editor had before it was fixed: without this the header
  // and footer builder rendered the bare shadcn default palette instead of
  // the tenant's brand colors, so a header built here looked nothing like
  // the same header on the published site. Scoped to .cms-canvas-light (added
  // around the canvas in the client), same trick the page editor uses so this
  // stays confined to block content and never fights the admin's own
  // dark/light toggle.
  const templateIdentity = data?.template_id
    ? await resolveDbTemplateIdentity(data.template_id)
    : null;
  const colorOverrides = (data?.color_overrides ?? null) as Partial<import("@/modules/themes/template-types").TemplatePalette> | null;
  const FALLBACK_PALETTE = {
    primary: "#2563EB", primaryFg: "#ffffff",
    secondary: "#0F172A", accent: "#38BDF8",
    background: "#FFFFFF", foreground: "#0F172A",
    muted: "#F1F5F9", mutedFg: "#64748B",
    card: "#FFFFFF", border: "#E2E8F0", ring: "#2563EB",
    borderRadius: "0.75rem",
  };
  const FALLBACK_TYPOGRAPHY = {
    headingFont: "Inter", bodyFont: "Inter",
    headingWeight: "700", letterSpacing: "-0.02em",
  };
  const mergedPalette = templateIdentity
    ? { ...templateIdentity.palette, ...(colorOverrides ?? {}) }
    : { ...FALLBACK_PALETTE, ...(colorOverrides ?? {}) };
  const templateCSSVars = buildTemplateCSSVars(
    mergedPalette,
    templateIdentity?.typography ?? FALLBACK_TYPOGRAPHY,
    ".cms-canvas-light",
  );
  const templateCustomCss = templateIdentity?.customCss ?? null;

  return (
    <>
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      {templateCustomCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: templateCustomCss }} />}
      <HeaderBuilderClient
        target={target}
        initialBlocks={initialBlocks}
        tenantId={tenantId}
        returnTo={returnTo}
      />
    </>
  );
}
