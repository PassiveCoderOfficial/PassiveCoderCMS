import { createAdminClient } from "@/lib/supabase/server";
import { createSlug } from "@/lib/utils";
import type { Block } from "@/types/cms";
import type { BusinessFacts } from "./brief";
import { planPage, type SitePlan } from "./plan";
import { buildPageFromPlan } from "./build-page";
import { AiCoderError } from "./generate";
import { AiCoderQuotaError } from "./quota";

/**
 * Whole-site generation: plan each page, write its sections, create the page
 * rows, then wire the navigation and footer link lists to match what actually
 * got created.
 *
 * Pages are created as DRAFTS. A generated site is a starting point the owner
 * reviews and edits, not something that should appear on their live domain the
 * moment the model finishes — publishing stays a deliberate human action.
 */

export interface BuiltSitePage {
  title: string;
  slug: string;
  pageId?: string;
  blockCount: number;
  failedSections: number;
  error?: string;
}

export interface BuildSiteResult {
  pages: BuiltSitePage[];
  generationsUsed: number;
}

export async function buildSiteFromPlan(
  sitePlan: SitePlan,
  facts: BusinessFacts,
  tenantId: string,
  userId: string | null,
): Promise<BuildSiteResult> {
  const admin = await createAdminClient();
  const results: BuiltSitePage[] = [];
  let generationsUsed = 0;

  const slugs = await resolveSlugs(tenantId, sitePlan);

  // Built up as pages are created, then written back into every nav/footer
  // block at the end — the first page's navigation cannot link to pages that
  // do not exist yet, so link targets are patched once the full set is known.
  const navTargets: { label: string; url: string }[] = [];

  for (let i = 0; i < sitePlan.pages.length; i++) {
    const page = sitePlan.pages[i];
    const slug = slugs[i];

    try {
      const plan = await planPage(facts, page.brief, page.isHome ? "home" : "interior");
      const built = await buildPageFromPlan(plan.sections, facts, tenantId, userId);
      generationsUsed += built.generationsUsed;

      if (built.blocks.length === 0) {
        results.push({
          title: page.title,
          slug,
          blockCount: 0,
          failedSections: built.failedCount,
          error: built.sections.find(s => s.error)?.error ?? "No sections could be generated",
        });
        continue;
      }

      const { data: created, error } = await admin
        .from("pages")
        .insert({
          tenant_id: tenantId,
          title: page.title,
          slug,
          type: "page",
          status: "draft",
          blocks: built.blocks,
          seo: { title: plan.pageTitle, description: plan.metaDescription },
          settings: { show_header: true, show_footer: true },
          order_index: i,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error) {
        results.push({
          title: page.title, slug, blockCount: 0,
          failedSections: built.failedCount,
          error: `Couldn't create the page: ${error.message}`,
        });
        continue;
      }

      navTargets.push({ label: page.title, url: page.isHome ? "/" : `/${slug}` });
      results.push({
        title: page.title,
        slug,
        pageId: created.id,
        blockCount: built.blocks.length,
        failedSections: built.failedCount,
      });
    } catch (err) {
      // Quota exhaustion ends the run — every later page would fail the same
      // way, and burning the remaining budget on planning calls that can never
      // be built would waste it.
      if (err instanceof AiCoderQuotaError) {
        for (let j = i; j < sitePlan.pages.length; j++) {
          results.push({
            title: sitePlan.pages[j].title,
            slug: slugs[j],
            blockCount: 0,
            failedSections: 0,
            error: err.message,
          });
        }
        break;
      }
      results.push({
        title: page.title, slug, blockCount: 0, failedSections: 0,
        error: err instanceof AiCoderError ? err.message : "This page couldn't be generated",
      });
    }
  }

  if (navTargets.length > 1) {
    await rewireNavigation(results, navTargets);
  }

  return { pages: results, generationsUsed };
}

/**
 * Assigns a unique slug per planned page.
 *
 * `pages_tenant_slug_unique` is a hard database constraint, and it does NOT
 * exclude soft-deleted rows — a page in the trash still owns its slug. So
 * collisions are resolved against every existing row regardless of
 * `deleted_at`, and against the other pages in this same run, before any insert
 * is attempted. Losing a whole generated page to a unique-violation at insert
 * time (after paying for all its generations) is the failure this prevents.
 */
async function resolveSlugs(tenantId: string, sitePlan: SitePlan): Promise<string[]> {
  const admin = await createAdminClient();
  const { data: existing } = await admin
    .from("pages")
    .select("slug")
    .eq("tenant_id", tenantId);

  const taken = new Set((existing ?? []).map(p => p.slug as string));
  const out: string[] = [];

  for (const page of sitePlan.pages) {
    // The home page is conventionally slug "home" here; the planner is told to
    // use it, but a model that ignored that shouldn't produce a stray page.
    const base = createSlug(page.isHome ? "home" : page.slug) || createSlug(page.title) || "page";
    let slug = base;
    let n = 2;
    while (taken.has(slug)) {
      slug = `${base}-${n}`;
      n++;
    }
    taken.add(slug);
    out.push(slug);
  }

  return out;
}

/**
 * Rewrites nav and footer link lists so they point at the pages that actually
 * got created.
 *
 * Each page was planned in isolation, so its navigation block contains the
 * links the model guessed at — plausible, but not necessarily matching the
 * final page set or its collision-resolved slugs. Patching afterwards is what
 * makes a generated site navigable rather than a set of pages with broken menus.
 */
async function rewireNavigation(
  pages: BuiltSitePage[],
  navTargets: { label: string; url: string }[],
): Promise<void> {
  const admin = await createAdminClient();

  for (const page of pages) {
    if (!page.pageId) continue;

    const { data: row } = await admin
      .from("pages")
      .select("blocks")
      .eq("id", page.pageId)
      .maybeSingle();
    if (!row) continue;

    const blocks = row.blocks as Block[];
    let changed = false;

    for (const block of blocks) {
      if (block.type === "navigation") {
        const data = block.data as { items?: unknown[] };
        data.items = navTargets.map((t, i) => ({
          id: `nav-${i}`,
          label: t.label,
          url: t.url,
        }));
        changed = true;
      } else if (block.type === "footer") {
        // Only the first footer column is treated as site navigation; later
        // columns may hold service lists or other groupings the model wrote
        // deliberately, and overwriting those would lose real content.
        const data = block.data as { columns?: { id: string; heading: string; links: unknown[] }[] };
        if (data.columns?.length) {
          data.columns[0].links = navTargets.map((t, i) => ({
            id: `foot-${i}`,
            label: t.label,
            url: t.url,
          }));
          changed = true;
        }
      }
    }

    if (changed) {
      await admin.from("pages").update({ blocks }).eq("id", page.pageId);
    }
  }
}
