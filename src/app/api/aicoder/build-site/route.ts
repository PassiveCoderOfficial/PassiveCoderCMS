import { NextResponse, after } from "next/server";
import { isViewOnlyMember } from "@/lib/auth/site-write";
import { aiFeatureAvailable } from "@/lib/ai/provider";
import { autoFillSeo } from "@/lib/seo/ai-meta";
import { ensureBookingNav } from "@/lib/booking/nav";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { businessFactsSchema } from "@/lib/aicoder/brief";
import { buildSitePage, rewireNavigation } from "@/lib/aicoder/build-site";
import type { SitePlan } from "@/lib/aicoder/plan";
import { pageLimitMessage, PAGE_LIMIT_CODE } from "@/lib/usage/page-limit";

// The platform caps serverless functions at 300s, and a whole site (a page
// plan plus ~9 sequential block generations, times five or six pages) does not
// fit in that. So this route builds ONE page per call and the client drives the
// loop — which also means the user watches pages appear one by one instead of
// staring at a spinner for six minutes, and a failure costs one page rather
// than the entire run.
export const maxDuration = 300;

/**
 * Step 2 of full-site generation: build ONE planned page and create it.
 *
 * Call once per page, passing `pageIndex`. The response reports whether more
 * pages remain, and the final call (when `isLast` is set) rewires navigation
 * across everything that was created.
 *
 * Unlike page generation, this DOES write to the database — a site run creates
 * several pages, which has no builder-store equivalent to stage them in. They
 * are created as drafts so nothing reaches the live site without the owner
 * publishing it deliberately.
 */
export async function POST(req: Request) {
  // Whole-site building runs on Passive Coder AI (or the hosted platform), not on an own key.
  if (!aiFeatureAvailable("site_build")) {
    return NextResponse.json({ error: "Building a whole site needs Passive Coder AI. Your own AI key works for writing and rewriting text on single pages.", code: "needs_passivecoder_ai" }, { status: 403 });
  }
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // View-only team members cannot do this (owner, admin, editor, staff and super admins can).
  if (await isViewOnlyMember(tenantId)) return NextResponse.json({ error: "Your role on this site is view only, so it can't use AI building." }, { status: 403 });

  if (!await requireModule(tenantId, "ai_coder")) {
    return NextResponse.json({ error: "AiCoder isn't included in this site's plan" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { facts: rawFacts, pages: rawPages, pageIndex, created: rawCreated } = body as {
    facts?: unknown;
    pages?: { title?: string; slug?: string; brief?: string; isHome?: boolean }[];
    pageIndex?: number;
    /** Pages created by earlier calls in this run, echoed back so the final
     *  call can wire navigation across the whole set. */
    created?: { title?: string; slug?: string; pageId?: string; isHome?: boolean }[];
  };

  // Facts round-trip through the client, so re-validate — they carry the
  // "never claim X" constraints every generation in the run depends on.
  const factsResult = businessFactsSchema.safeParse(rawFacts);
  if (!factsResult.success) {
    return NextResponse.json({ error: "Invalid business facts — re-plan the site." }, { status: 400 });
  }

  if (!Array.isArray(rawPages) || rawPages.length === 0) {
    return NextResponse.json({ error: "No pages to build" }, { status: 400 });
  }
  if (rawPages.length > 8) {
    return NextResponse.json({ error: "Too many pages — 8 is the maximum for one site run." }, { status: 400 });
  }

  const pages: SitePlan["pages"] = [];
  for (const p of rawPages) {
    if (!p.title?.trim() || !p.brief?.trim()) {
      return NextResponse.json({ error: "Every page needs a title and a brief" }, { status: 400 });
    }
    pages.push({
      title: p.title.trim().slice(0, 60),
      slug: (p.slug ?? p.title).trim().slice(0, 60),
      brief: p.brief.trim().slice(0, 800),
      isHome: !!p.isHome,
    });
  }

  // Exactly one home page — the slug resolver and nav wiring both depend on it,
  // and the client can edit the plan freely before sending it back.
  if (!pages.some(p => p.isHome)) pages[0].isHome = true;
  let seenHome = false;
  for (const p of pages) {
    if (p.isHome && seenHome) p.isHome = false;
    else if (p.isHome) seenHome = true;
  }

  const index = typeof pageIndex === "number" ? pageIndex : 0;
  if (index < 0 || index >= pages.length) {
    return NextResponse.json({ error: "pageIndex out of range" }, { status: 400 });
  }

  // Check the plan's page limit before generating: the insert trigger would
  // reject the page anyway, but only after its sections had used up AI
  // generations. Counted by the same rules as the trigger (migration 147).
  const { data: usage } = await (await createAdminClient()).rpc("tenant_page_usage", { p_tenant: tenantId });
  const u = (Array.isArray(usage) ? usage[0] : usage) as { page_count: number; page_limit: number | null } | null;
  if (u && u.page_limit != null && u.page_limit >= 0 && u.page_count >= u.page_limit) {
    return NextResponse.json({ error: pageLimitMessage(u.page_limit), code: PAGE_LIMIT_CODE }, { status: 403 });
  }

  try {
    const result = await buildSitePage({ pages }, index, factsResult.data, tenantId, user.id);
    const isLast = index === pages.length - 1;

    // Navigation can only be wired once every page exists, so the final call
    // patches the whole set — including this call's own page, which is why the
    // client echoes back what earlier calls created.
    if ((isLast || result.quotaExhausted)) {
      // Only the ids (and which one is the home page) are taken from the
      // request; rewireNavigation reads titles and addresses from this site's
      // own rows and ignores any id that is not one of its pages.
      const all = [
        ...(Array.isArray(rawCreated) ? rawCreated : [])
          .filter(p => p && typeof p.pageId === "string")
          .map(p => ({ pageId: p.pageId as string, isHome: !!p.isHome })),
        ...(result.page.pageId
          ? [{ pageId: result.page.pageId, isHome: pages[index].isHome }]
          : []),
      ];

      if (all.length > 1) {
        await rewireNavigation(tenantId, all).catch(() => {});
        await ensureBookingNav(await createAdminClient(), tenantId).catch(() => {});
      }
      after(async () => { await autoFillSeo(await createAdminClient(), tenantId).catch((e) => console.error("[seo] autofill", e instanceof Error ? e.message : e)); });
    }

    return NextResponse.json({
      page: result.page,
      generationsUsed: result.generationsUsed,
      quotaExhausted: result.quotaExhausted,
      nextIndex: result.quotaExhausted || isLast ? null : index + 1,
      isHome: pages[index].isHome,
    });
  } catch (err) {
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AiCoder site generation failed" },
      { status: 500 },
    );
  }
}
