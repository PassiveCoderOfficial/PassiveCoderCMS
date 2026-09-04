import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { planOnboardingBuild, runOnboardingBuildTick } from "@/lib/aicoder/onboarding-build";

export const maxDuration = 300;

/**
 * Kill switch for the automatic signup build.
 *
 * Disabled after a test signup showed the build cannot finish inside one
 * invocation: four pages at roughly nine sections each is ~36 sequential model
 * calls, and the platform stops the function at 300s. Because a killed
 * function does not throw, the recovery in runOnboardingBuild's catch never
 * ran — the template's pages had already been retired to free up their slugs,
 * so the site was left serving the template's cached content under the
 * customer's own name. An electrical contractor's site advertised aircon and
 * plumbing.
 *
 * Stays false until the build is resumable across invocations. Set
 * ONBOARDING_AUTOBUILD=on to re-enable.
 */
const AUTOBUILD_ENABLED = process.env.ONBOARDING_AUTOBUILD === "on";

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

  if (!AUTOBUILD_ENABLED) {
    // Not an error: the caller is a fire-and-forget fetch in onboarding, and
    // the customer keeps the template site they chose.
    return NextResponse.json({ ok: true, skipped: "autobuild_disabled" });
  }

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

  // Plan, then build the first page in the same invocation so the customer
  // sees real content quickly. The cron picks up the rest — page one is the
  // only one they are likely to watch for.
  after(async () => {
    await planOnboardingBuild({
      tenantId,
      userId: user.id,
      siteName: siteName || tenant.name || "",
      what: what ?? "",
      where: where ?? "",
    });
    // One page now, so the dashboard is not empty while the cron catches up.
    await runOnboardingBuildTick().catch(() => {});
  });

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
