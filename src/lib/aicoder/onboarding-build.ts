import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { parseBrief, planSite, type SitePlan } from "./plan";
import { buildSitePage } from "./build-site";
import { renderProfileBrief, mergeBrief } from "./profile-brief";
import type { BusinessFacts } from "./brief";
import { suggestTheme } from "./generate";
import { applyThemeSuggestion } from "./apply-theme";

/**
 * The automatic site build that runs at signup.
 *
 * The page-builder dialog drives generation from the client, one page per
 * request, because a whole site does not fit in a 300s serverless call. That
 * works when someone is watching a progress bar, but it cannot be the signup
 * path — the customer closes the tab and the build dies half-finished.
 *
 * So this runs page by page from the server, recording progress in
 * onboarding_build_jobs, and each page it finishes is committed immediately.
 * A build interrupted at page four leaves four real pages, not nothing.
 */

/** Enough to cover a 5-6 page site plus planning, with headroom for retries. */
export const FREE_BUILD_CREDITS = 80;

/**
 * Slug prefix for a template page the build has moved aside.
 *
 * Chosen to be something no human would type and no slug generator would
 * produce, so a parked page can always be identified by its slug alone —
 * including by a later run that has no memory of the one that parked it.
 */
const PARKED_PREFIX = "zz-parked-";

/**
 * Give parked template pages their original slugs back.
 *
 * Keyed off the prefix rather than a list of ids, so this also recovers a site
 * whose build was killed mid-run and left pages parked with nothing to
 * replace them. Skips any slug a generated page has since taken.
 */
async function restoreParkedPages(admin: SupabaseClient, tenantId: string): Promise<number> {
  const { data: parked } = await admin
    .from("pages")
    .select("id, slug")
    .eq("tenant_id", tenantId)
    .like("slug", `${PARKED_PREFIX}%`);

  const rows = (parked ?? []) as { id: string; slug: string }[];
  if (!rows.length) return 0;

  const { data: live } = await admin
    .from("pages")
    .select("slug")
    .eq("tenant_id", tenantId)
    .not("slug", "like", `${PARKED_PREFIX}%`)
    .is("deleted_at", null);
  const taken = new Set((live ?? []).map(p => p.slug as string));

  let restored = 0;
  for (const row of rows) {
    const original = row.slug.slice(PARKED_PREFIX.length);
    // A generated page already owns this slug — leave the parked one parked
    // rather than creating a duplicate the router cannot disambiguate.
    if (taken.has(original)) continue;
    await admin.from("pages").update({ slug: original }).eq("id", row.id);
    taken.add(original);
    restored++;
  }
  return restored;
}

export interface OnboardingBuildInput {
  tenantId: string;
  userId: string | null;
  siteName: string;
  /** What the business does, in the owner's words. */
  what: string;
  /** Where it operates. */
  where: string;
}

/**
 * Turns the signup answers into the brief the fact extractor reads.
 *
 * The extractor is instructed never to state anything the brief does not, so
 * everything here is either something the owner typed or a neutral framing —
 * no invented services, credentials or figures.
 */
export function buildOnboardingBrief(input: OnboardingBuildInput): string {
  const lines = [`The business is called "${input.siteName}".`];
  if (input.what) lines.push(`In the owner's own words, what they do: ${input.what}`);
  if (input.where) lines.push(`They operate in: ${input.where}.`);
  lines.push(
    "Write a professional small-business website for them.",
    "Use only the facts above. Do not invent services, credentials, years in business,",
    "customer numbers, prices, testimonials or team members that were not stated.",
  );
  return lines.join("\n");
}

async function setJob(tenantId: string, patch: Record<string, unknown>) {
  const admin = await createAdminClient();
  await admin.from("onboarding_build_jobs").upsert(
    { tenant_id: tenantId, ...patch },
    { onConflict: "tenant_id" },
  );
}

/**
 * Phase 1: plan the site, then build nothing.
 *
 * Planning is one extraction call plus one planning call — comfortably inside
 * a single invocation — and its output is persisted so no later invocation
 * ever has to redo it. Page generation is deliberately left to the cron, which
 * builds one page per tick.
 *
 * Never throws: a failure is recorded on the job, and the customer keeps the
 * template site they chose.
 */
export async function planOnboardingBuild(input: OnboardingBuildInput): Promise<void> {
  const { tenantId } = input;
  const admin = await createAdminClient();

  try {
    await setJob(tenantId, {
      status: "planning",
      started_at: new Date().toISOString(),
      error: null,
      next_page_index: 0,
      pages_done: 0,
      attempts: 0,
      locked_at: null,
    });

    // Grant the one-time build allowance. Set here rather than at tenant
    // creation so a tenant that never reaches this point does not carry
    // spendable credits around.
    await admin.from("tenants")
      .update({ ai_free_build_credits: FREE_BUILD_CREDITS })
      .eq("id", tenantId);

    const ownBrief = buildOnboardingBrief(input);
    const brief = mergeBrief(await renderProfileBrief(tenantId), ownBrief);

    const facts = await parseBrief(brief);
    const plan = await planSite(facts, brief);

    // Match the palette to the business before any page is written. Generated
    // copy on a template's stock colours reads as two businesses stapled
    // together. Best-effort — a theme failure must not cost them the site.
    try {
      const theme = await suggestTheme(facts);
      await applyThemeSuggestion(tenantId, theme as Record<string, string>);
    } catch (err) {
      console.error(`[onboarding-build] theme skipped for tenant ${tenantId}`, err);
    }

    // Move the template's pages aside WITHOUT unpublishing them.
    //
    // Slug allocation avoids anything already present, so leaving them on
    // "home", "services" and so on would push the generated home page to
    // "home-2" and suffix every other slug. Deleting them first is how an
    // earlier version wrecked a site: the build was killed at the platform's
    // 300s ceiling, a killed function does not throw, so the restore never ran
    // and the customer was left with no pages at all.
    //
    // Renaming means the worst case is a live site on uglier slugs, never an
    // empty one. The rows stay published throughout.
    const { data: templatePages } = await admin
      .from("pages").select("id, slug").eq("tenant_id", tenantId).is("deleted_at", null);
    for (const row of (templatePages ?? []) as { id: string; slug: string }[]) {
      await admin.from("pages")
        .update({ slug: `${PARKED_PREFIX}${row.slug}` })
        .eq("id", row.id);
    }

    await setJob(tenantId, {
      status: "building",
      total_pages: plan.pages.length,
      pages_done: 0,
      next_page_index: 0,
      plan,
      facts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Site planning failed";
    console.error(`[onboarding-build] plan tenant=${tenantId}`, message);
    try { await restoreParkedPages(admin, tenantId); } catch { /* best effort */ }
    await admin.from("tenants").update({ ai_free_build_credits: 0 }).eq("id", tenantId);
    await setJob(tenantId, {
      status: "failed",
      error: message,
      finished_at: new Date().toISOString(),
      current_page: null,
    });
  }
}

/** A page attempt that keeps failing must not hold the queue forever. */
const MAX_ATTEMPTS_PER_JOB = 12;
/**
 * A lock older than this is treated as abandoned — the holder was killed.
 *
 * A page takes roughly ninety seconds, so six minutes was far too generous:
 * after an inline attempt was killed the job sat unclaimable while the cron
 * ticked past it, which would turn a five-page site into a half-hour build.
 * Three minutes still comfortably clears a healthy page.
 */
const LOCK_STALE_MS = 3 * 60 * 1000;

export interface BuildTickResult {
  tenantId: string;
  pageTitle?: string;
  built: boolean;
  finished: boolean;
  error?: string;
}

/**
 * Builds ONE page of one waiting job, then returns.
 *
 * One page per invocation is the whole point: a page is roughly nine
 * sequential model calls, which fits inside the platform's limit, whereas a
 * whole site does not. The cron calls this repeatedly until the job reports
 * finished.
 */
export async function runOnboardingBuildTick(): Promise<BuildTickResult | null> {
  const admin = await createAdminClient();
  const staleBefore = new Date(Date.now() - LOCK_STALE_MS).toISOString();

  // Oldest waiting job whose lock is free or stale. Stale locks are retaken
  // because the previous holder was killed mid-page and will never return.
  const { data: jobs } = await admin
    .from("onboarding_build_jobs")
    .select("*")
    .eq("status", "building")
    .or(`locked_at.is.null,locked_at.lt.${staleBefore}`)
    .order("started_at", { ascending: true })
    .limit(1);

  const job = (jobs ?? [])[0] as {
    tenant_id: string;
    plan: SitePlan | null;
    facts: BusinessFacts | null;
    next_page_index: number;
    pages_done: number;
    total_pages: number;
    attempts: number;
  } | undefined;
  if (!job) return null;

  const tenantId = job.tenant_id;

  // Claim it. The lock is advisory — worst case two workers build the same
  // page and the second one's slug gets suffixed — but it stops a 15-minute
  // cron stacking up on one slow job.
  await admin.from("onboarding_build_jobs")
    .update({ locked_at: new Date().toISOString(), attempts: job.attempts + 1 })
    .eq("tenant_id", tenantId);

  if (!job.plan || !job.facts) {
    await failJob(admin, tenantId, "Plan missing — cannot resume");
    return { tenantId, built: false, finished: true, error: "Plan missing" };
  }

  if (job.attempts >= MAX_ATTEMPTS_PER_JOB) {
    await failJob(admin, tenantId, `Gave up after ${job.attempts} attempts`);
    return { tenantId, built: false, finished: true, error: "Too many attempts" };
  }

  const plan = job.plan;
  const index = job.next_page_index;

  // All pages attempted — finish up.
  if (index >= plan.pages.length) {
    await finishJob(admin, tenantId, job.pages_done);
    return { tenantId, built: false, finished: true };
  }

  const pageTitle = plan.pages[index]?.title;

  try {
    await admin.from("onboarding_build_jobs")
      .update({ current_page: pageTitle })
      .eq("tenant_id", tenantId);

    const { data: tenant } = await admin
      .from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();

    const result = await buildSitePage(plan, index, job.facts, tenantId, tenant?.owner_id ?? null);
    const built = !!result.page.pageId;
    const pagesDone = job.pages_done + (built ? 1 : 0);

    // Advance the cursor even when a page failed: retrying one bad page
    // forever would starve the rest of the site.
    const nextIndex = index + 1;
    const done = result.quotaExhausted || nextIndex >= plan.pages.length;

    await admin.from("onboarding_build_jobs")
      .update({ pages_done: pagesDone, next_page_index: nextIndex, locked_at: null })
      .eq("tenant_id", tenantId);

    if (done) await finishJob(admin, tenantId, pagesDone);

    return { tenantId, pageTitle, built, finished: done };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Page build failed";
    console.error(`[onboarding-build] tick tenant=${tenantId} page=${index}`, message);
    // Release the lock and move past this page rather than wedging the job.
    await admin.from("onboarding_build_jobs")
      .update({ next_page_index: index + 1, locked_at: null, error: message })
      .eq("tenant_id", tenantId);
    return { tenantId, pageTitle, built: false, finished: false, error: message };
  }
}

/** Publish what was written, or hand the template back if nothing was. */
async function finishJob(admin: SupabaseClient, tenantId: string, pagesDone: number): Promise<void> {
  if (pagesDone > 0) {
    // Publishing is the point — "your site is live" is what signup promises.
    // Parked template pages are excluded so they do not reappear alongside the
    // generated ones.
    await admin.from("pages")
      .update({ status: "published" })
      .eq("tenant_id", tenantId)
      .not("slug", "like", `${PARKED_PREFIX}%`)
      .is("deleted_at", null);
  } else {
    await restoreParkedPages(admin, tenantId);
  }

  await admin.from("tenants")
    .update({ ai_onboarding_build_at: new Date().toISOString(), ai_free_build_credits: 0 })
    .eq("id", tenantId);

  await admin.from("onboarding_build_jobs")
    .update({
      status: pagesDone > 0 ? "done" : "failed",
      finished_at: new Date().toISOString(),
      error: pagesDone > 0 ? null : "No pages could be generated",
      current_page: null,
      locked_at: null,
    })
    .eq("tenant_id", tenantId);
}

async function failJob(admin: SupabaseClient, tenantId: string, message: string): Promise<void> {
  try { await restoreParkedPages(admin, tenantId); } catch { /* best effort */ }
  await admin.from("tenants").update({ ai_free_build_credits: 0 }).eq("id", tenantId);
  await admin.from("onboarding_build_jobs")
    .update({
      status: "failed",
      error: message,
      finished_at: new Date().toISOString(),
      current_page: null,
      locked_at: null,
    })
    .eq("tenant_id", tenantId);
}
