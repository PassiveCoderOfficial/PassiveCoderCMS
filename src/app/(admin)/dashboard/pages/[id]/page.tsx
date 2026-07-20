import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { BuilderInterface } from "@/components/admin/page-builder/builder-interface";
import { PageEditorHeader } from "./page-editor-header";
import { getTemplateIdentity } from "@/modules/themes/template-registry";
import { buildTemplateCSSVars } from "@/modules/themes/template-css";
import type { Page } from "@/types/cms";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PageEditorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .single();

  if (!page) notFound();

  // The canvas otherwise renders un-themed (default palette) even though the
  // live site applies the tenant's active template CSS vars — editors saw
  // plain white cards / default colors that looked nothing like the
  // published page. Fetch the same template identity SiteLayout uses and
  // inject its CSS vars into the builder too.
  let templateCSSVars: string | null = null;
  let templateCustomCss: string | null = null;
  let tenantSlug: string | null = null;
  if (page.tenant_id) {
    const admin = await createAdminClient();
    const [{ data: identity }, { data: tenant }] = await Promise.all([
      admin.from("site_identity").select("active_template_slug").eq("tenant_id", page.tenant_id).maybeSingle(),
      admin.from("tenants").select("slug").eq("id", page.tenant_id).maybeSingle(),
    ]);
    const templateIdentity = identity?.active_template_slug ? getTemplateIdentity(identity.active_template_slug) : null;
    if (templateIdentity) {
      templateCSSVars = buildTemplateCSSVars(templateIdentity.palette, templateIdentity.typography);
      templateCustomCss = templateIdentity.customCss ?? null;
    }
    tenantSlug = tenant?.slug ?? null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {templateCSSVars && <style dangerouslySetInnerHTML={{ __html: templateCSSVars }} />}
      {templateCustomCss && <style dangerouslySetInnerHTML={{ __html: templateCustomCss }} />}
      <PageEditorHeader page={page as Page} tenantSlug={tenantSlug} />
      <div className="flex-1 overflow-hidden">
        <BuilderInterface page={page as Page} />
      </div>
    </div>
  );
}
