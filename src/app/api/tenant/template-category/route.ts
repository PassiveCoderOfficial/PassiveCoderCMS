import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Returns the free-text category of the tenant's own site template, so the
 * empty-page template picker can default to templates that share the
 * business's actual content domain.
 *
 * Read-only and scoped to one field — no auth check beyond a valid tenantId,
 * since a template's category name ("Renovation & Construction") isn't
 * sensitive and every other tenant-scoped read in the builder already trusts
 * the tenantId the client holds (it comes from the page/store, not user input
 * that grants access to anything).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ category: null });

  const admin = await createAdminClient();
  const { data: identity } = await admin
    .from("site_identity")
    .select("template_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!identity?.template_id) return NextResponse.json({ category: null });

  const { data: template } = await admin
    .from("templates")
    .select("category")
    .eq("id", identity.template_id)
    .maybeSingle();

  return NextResponse.json({ category: template?.category ?? null });
}
