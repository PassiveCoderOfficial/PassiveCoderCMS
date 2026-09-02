import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { runOnboardingBuild } from "@/lib/aicoder/onboarding-build";

export const maxDuration = 300;

/**
 * Kicks off the automatic AI site build for a freshly created tenant.
 *
 * Returns immediately and runs the build in `after()`, so the signup flow is
 * not held open for the minutes a site takes to write. The client polls GET
 * for progress.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, what, where, siteName } = await req.json().catch(() => ({}));
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  const admin = await createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, owner_id, ai_onboarding_build_at")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Only the owner, or a member, can trigger a build for this tenant.
  const { data: member } = await admin
    .from("tenant_members").select("user_id")
    .eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
  if (tenant.owner_id !== user.id && !member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // One free build per tenant, ever. Without this a refresh at the wrong
  // moment spends a second grant and can delete pages mid-write.
  if (tenant.ai_onboarding_build_at) {
    return NextResponse.json({ error: "Site has already been built", alreadyBuilt: true }, { status: 409 });
  }
  const { data: existing } = await admin
    .from("onboarding_build_jobs").select("status").eq("tenant_id", tenantId).maybeSingle();
  if (existing && ["pending", "planning", "building"].includes(existing.status)) {
    return NextResponse.json({ ok: true, alreadyRunning: true });
  }

  await admin.from("onboarding_build_jobs").upsert(
    { tenant_id: tenantId, status: "pending", pages_done: 0, total_pages: 0, error: null, finished_at: null },
    { onConflict: "tenant_id" },
  );

  after(() => runOnboardingBuild({
    tenantId,
    userId: user.id,
    siteName: siteName || tenant.name || "",
    what: what ?? "",
    where: where ?? "",
  }));

  return NextResponse.json({ ok: true, started: true });
}

/** Build progress, for the signup screen to poll. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = new URL(req.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  const admin = await createAdminClient();
  const { data: job } = await admin
    .from("onboarding_build_jobs")
    .select("status, total_pages, pages_done, current_page, error")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return NextResponse.json({ job: job ?? null });
}
