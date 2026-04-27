import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, plan, owner_user_id } = await req.json();
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
      plan: plan ?? "trial",
      status: "trial",
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

  return NextResponse.json(data);
}
