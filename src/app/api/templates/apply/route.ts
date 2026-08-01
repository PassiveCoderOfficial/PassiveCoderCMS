import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { seedTemplate } from "@/lib/templates/seed-template";
import { applyDbTemplate, isDbTemplate } from "@/modules/templates/apply";

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
    // Regular user — verify they are an owner/admin of this tenant
    const { data: membership } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Templates authored through the engine live in the DB; the original 54
  // live in the hardcoded registry. Route to whichever owns this slug so
  // both work through one endpoint while the registry is phased out.
  const dbTemplateId = await isDbTemplate(admin, templateSlug);

  if (dbTemplateId) {
    const result = await applyDbTemplate(admin, tenantId, dbTemplateId, mode ?? "theme", {
      archiveExistingPages: archiveExistingPages ?? false,
    });
    return NextResponse.json({ ok: true, source: "db", ...result });
  }

  await seedTemplate(admin, tenantId, templateSlug, mode ?? "theme");
  return NextResponse.json({ ok: true, source: "registry" });
}
