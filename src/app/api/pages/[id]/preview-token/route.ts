import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { createPreviewToken } from "@/lib/site/preview-token";
import { publicUrl } from "@/lib/tenant/site-urls";

/**
 * A link that opens this page as it will look once published (draft blocks,
 * or an unpublished page), on the site's real address. Valid 30 minutes.
 * Used by the mobile app's preview screen.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await getApiCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const [{ data: page }, { data: tenant }] = await Promise.all([
    admin.from("pages").select("id, slug").eq("id", id).eq("tenant_id", caller.tenantId).is("deleted_at", null).maybeSingle(),
    admin.from("tenants").select("slug, custom_domain").eq("id", caller.tenantId).maybeSingle(),
  ]);
  if (!page || !tenant) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  // Always the explicit slug (not "/" for home) so the catch-all page route
  // receives it with the token.
  const url = `${publicUrl(tenant, `/${page.slug}`)}?pc_preview=${encodeURIComponent(createPreviewToken(page.id))}`;
  return NextResponse.json({ url });
}
