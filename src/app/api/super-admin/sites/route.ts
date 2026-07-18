import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { seedTemplate } from "@/lib/templates/seed-template";

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id,name,slug,status,custom_domain,domain_status,created_at,onboarding_completed,deletion_requested_at,owner_id")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sites: data ?? [] });
}

export async function POST(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, plan, owner_user_id, template_id, template_mode } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });

  const supabase = await createAdminClient();

  // Check slug availability
  const { data: existing } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name,
      slug,
      plan: plan ?? "basic",
      status: "onboarded",
      owner_id: owner_user_id ?? null,
      onboarding_completed: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // If owner provided, add them as tenant member with owner role
  if (owner_user_id) {
    await supabase.from("tenant_members").insert({
      tenant_id: data.id,
      user_id: owner_user_id,
      role: "owner",
    });
  }

  // Apply template (best-effort — never fail site creation because seeding errored)
  await seedTemplate(
    supabase,
    data.id,
    template_id ?? "blank",
    (template_mode as "theme" | "full") ?? "full",
  ).catch(err => console.error(`[seed-template] tenant=${data.id} slug=${template_id ?? "blank"}`, err));

  return NextResponse.json(data);
}
