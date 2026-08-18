import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { businessFactsSchema } from "@/lib/aicoder/brief";
import { buildSitePage, rewireNavigation } from "@/lib/aicoder/build-site";
import type { SitePlan } from "@/lib/aicoder/plan";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  try {
    const result = await buildSitePage({ pages }, index, factsResult.data, tenantId, user.id);
    const isLast = index === pages.length - 1;

    // Navigation can only be wired once every page exists, so the final call
    // patches the whole set — including this call's own page, which is why the
    // client echoes back what earlier calls created.
    if ((isLast || result.quotaExhausted)) {
      const all = [
        ...(rawCreated ?? [])
          .filter(p => p.pageId && p.title)
          .map(p => ({
            title: p.title as string,
            slug: p.slug ?? "",
            pageId: p.pageId as string,
            blockCount: 0,
            failedSections: 0,
            isHome: !!p.isHome,
          })),
        ...(result.page.pageId
          ? [{ ...result.page, isHome: pages[index].isHome }]
          : []),
      ];

      if (all.length > 1) {
        const navTargets = all.map(p => ({
          label: p.title,
          url: p.isHome ? "/" : `/${p.slug}`,
        }));
        await rewireNavigation(all, navTargets).catch(() => {});
      }
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
