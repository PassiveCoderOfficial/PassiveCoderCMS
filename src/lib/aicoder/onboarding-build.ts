import { createAdminClient } from "@/lib/supabase/server";
import { parseBrief, planSite } from "./plan";
import { buildSitePage } from "./build-site";
import { renderProfileBrief, mergeBrief } from "./profile-brief";
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
 * Runs the whole build. Never throws: a failure is recorded on the job and the
 * customer keeps whatever pages did get built, plus their template.
 */
export async function runOnboardingBuild(input: OnboardingBuildInput): Promise<void> {
  const { tenantId, userId } = input;
  const admin = await createAdminClient();
  // Declared out here so the catch block can restore exactly these pages.
  let templatePageIds: string[] = [];
  let built = 0;

  try {
    await setJob(tenantId, { status: "planning", started_at: new Date().toISOString(), error: null });

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

    await setJob(tenantId, { status: "building", total_pages: plan.pages.length, pages_done: 0 });

    // Match the palette to the business before writing pages. Generated copy
    // on a template's stock colours reads as two different businesses stapled
    // together. Best-effort — a theme failure must not cost them the site.
    try {
      const theme = await suggestTheme(facts);
      await applyThemeSuggestion(tenantId, theme as Record<string, string>);
    } catch (err) {
      console.error(`[onboarding-build] theme skipped for tenant ${tenantId}`, err);
    }

    // Retire the template's placeholder pages before generating, because slug
    // allocation avoids anything already present — leaving them in place would
    // push the generated home page to "home-2" and suffix every other slug.
    // They are soft-deleted, not destroyed, and restored below if the build
    // produced nothing, so a failure never costs the customer their site.
    const { data: templatePages } = await admin
      .from("pages").select("id").eq("tenant_id", tenantId).is("deleted_at", null);
    templatePageIds = (templatePages ?? []).map(p => p.id as string);
    if (templatePageIds.length) {
      await admin.from("pages")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", templatePageIds);
    }

    for (let i = 0; i < plan.pages.length; i++) {
      await setJob(tenantId, { current_page: plan.pages[i].title });
      const result = await buildSitePage(plan, i, facts, tenantId, userId);
      if (result.page.pageId) built++;
      await setJob(tenantId, { pages_done: i + 1 });

      // Out of credit: stop rather than spend planning calls on pages that
      // cannot be written.
      if (result.quotaExhausted) break;
    }

    // Nothing generated: put the template back rather than leaving an empty
    // site behind.
    if (built === 0 && templatePageIds.length) {
      await admin.from("pages").update({ deleted_at: null }).in("id", templatePageIds);
    }

    // Publishing is the point — "your site is live" is what was promised at
    // signup. Only the generated pages go live.
    if (built > 0) {
      await admin.from("pages")
        .update({ status: "published" })
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);
    }

    await admin.from("tenants")
      .update({ ai_onboarding_build_at: new Date().toISOString(), ai_free_build_credits: 0 })
      .eq("id", tenantId);

    await setJob(tenantId, {
      status: built > 0 ? "done" : "failed",
      finished_at: new Date().toISOString(),
      error: built > 0 ? null : "No pages could be generated",
      current_page: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Site build failed";
    console.error(`[onboarding-build] tenant=${tenantId}`, message);
    // A customer with a placeholder site is far better off than one with no
    // site, so undo the soft-delete if the build died before replacing it.
    // Only when nothing was written: restoring templates alongside generated
    // pages would put two pages on the same slug.
    if (built === 0 && templatePageIds.length) {
      try {
        await admin.from("pages").update({ deleted_at: null }).in("id", templatePageIds);
      } catch { /* best effort — the job already records the failure */ }
    }
    await admin.from("tenants").update({ ai_free_build_credits: 0 }).eq("id", tenantId);
    await setJob(tenantId, {
      status: "failed",
      error: message,
      finished_at: new Date().toISOString(),
      current_page: null,
    });
  }
}
