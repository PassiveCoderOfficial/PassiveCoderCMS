import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";
import { checkTenantEditAccess } from "@/modules/tenant/can-edit";


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

  const access = await checkTenantEditAccess(admin, tenantId, user.id, ["owner", "admin"]);
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: access.reason === "role"
          ? `Your role on this site (${access.role}) can't change the theme — an owner or admin must do it.`
          : "You don't have permission to change this site's theme.",
      },
      { status: 403 },
    );
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
