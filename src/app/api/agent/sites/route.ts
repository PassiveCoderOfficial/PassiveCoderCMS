import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agent";
import { seedTemplate } from "@/lib/templates/seed-template";

export async function POST(req: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });
  if (agent.status !== "active") return NextResponse.json({ error: "Staff account is not active" }, { status: 403 });

  const { name, slug, plan, owner_email, is_my_site, template_id, template_mode } = await req.json();
  if (!name?.trim() || !slug?.trim()) return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });

  const supabase = await createAdminClient();

  // Check slug availability
  const { data: existing } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });

  // Resolve owner
  let ownerUserId: string | null = null;
  if (is_my_site) {
    ownerUserId = user.id;
  } else if (owner_email?.trim()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", owner_email.trim())
      .maybeSingle();
    ownerUserId = profile?.id ?? null;
  }

  const { data: site, error } = await supabase
    .from("tenants")
    .insert({
      name: name.trim(),
      slug,
      plan: plan ?? "basic",
      status: "onboarded",
      owner_id: ownerUserId,
      onboarding_completed: true,
      referred_by_agent_id: agent.id,
      assigned_agent_id: agent.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Add owner as tenant member
  if (ownerUserId) {
    const hasMembers = await supabase.from("tenant_members").select("tenant_id").eq("user_id", ownerUserId).limit(1);
    const isPrimary = !hasMembers.data?.length;
    await supabase.from("tenant_members").insert({
      tenant_id: site.id,
      user_id: ownerUserId,
      role: "owner",
      is_primary: isPrimary,
    });
  }

  // Increment agent total_sites
  await supabase.from("agents").update({ total_sites: agent.total_sites + 1 }).eq("id", agent.id);

  // Apply template (best-effort — never fail site creation because seeding errored)
  await seedTemplate(
    supabase,
    site.id,
    template_id ?? "blank",
    (template_mode as "theme" | "full") ?? "full",
  ).catch(err => console.error(`[seed-template] tenant=${site.id} slug=${template_id ?? "blank"}`, err));

  return NextResponse.json({ id: site.id });
}
