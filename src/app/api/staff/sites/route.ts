import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/staff";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";

export async function POST(req: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getStaff();
  if (!agent) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });
  if (agent.status !== "active") return NextResponse.json({ error: "Staff account is not active" }, { status: 403 });

  const { name, slug, plan, owner_email, is_my_site, template_id, template_mode } = await req.json();
  if (!name?.trim() || !slug?.trim()) return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });

  const supabase = await createAdminClient();

  // Check slug availability
  const { data: existing } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });

  // Resolve owner.
  //
  // Falls back to the staff member who built it. An owner email that matches
  // no profile yet (the client hasn't signed up) used to leave owner_id null
  // and no tenant_members row at all, so the site belonged to nobody: every
  // permission check that asks "is this yours?" said no, and the staff
  // dashboard could open it but not change its theme or navigation.
  // Ownership transfers to the client when their account is assigned.
  let ownerUserId: string | null = user.id;
  if (!is_my_site && owner_email?.trim()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", owner_email.trim())
      .maybeSingle();
    if (profile?.id) ownerUserId = profile.id;
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
      referred_by_staff_id: agent.id,
      assigned_staff_id: agent.id,
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

  // Increment staff total_sites
  await supabase.from("pc_staff").update({ total_sites: agent.total_sites + 1 }).eq("id", agent.id);

  // Apply template (best-effort — never fail site creation because seeding errored)
  await applyTemplateBySlug(
    supabase,
    site.id,
    template_id ?? "blank",
    (template_mode as "theme" | "full") ?? "full",
    { siteName: name },
  ).catch(err => console.error(`[apply-template] tenant=${site.id} slug=${template_id ?? "blank"}`, err));

  return NextResponse.json({ id: site.id });
}
