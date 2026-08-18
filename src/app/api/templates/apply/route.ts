import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";


export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, templateSlug, mode, archiveExistingPages } = await req.json() as {
    tenantId?: string;
    templateSlug?: string;
    mode?: "theme" | "full";
    archiveExistingPages?: boolean;
  };
  if (!tenantId || !templateSlug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = await createAdminClient();

  // Super admins can apply templates to any tenant
  const { data: sa } = await admin
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sa) {
    // Regular user — verify they are an owner/admin of this tenant.
    // Read through the admin client: tenant_members' RLS only exposes the
    // caller's own rows, and .single() errors (rather than returning null)
    // when the row isn't visible, so an RLS miss looked identical to "not a
    // member" and produced a bare 403 with no way to tell which.
    const { data: membership } = await admin
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      // Owner without a tenant_members row — site creation doesn't always
      // write one, so ownership alone has to be enough to theme your own site.
      const { data: owned } = await admin
        .from("tenants")
        .select("id")
        .eq("id", tenantId)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!owned) {
        return NextResponse.json(
          { error: "You don't have permission to change this site's theme." },
          { status: 403 },
        );
      }
    } else if (!["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: `Your role on this site (${membership.role}) can't change the theme — an owner or admin must do it.` },
        { status: 403 },
      );
    }
  }

  const { source, ...result } = await applyTemplateBySlug(
    admin,
    tenantId,
    templateSlug,
    mode ?? "theme",
    { archiveExistingPages: archiveExistingPages ?? false },
  );
  return NextResponse.json({ ok: true, source, ...result });
}
