import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { businessFactsSchema } from "@/lib/aicoder/brief";
import { buildSiteFromPlan } from "@/lib/aicoder/build-site";
import type { SitePlan } from "@/lib/aicoder/plan";

// A site run is a page plan plus ~9 block generations per page, sequentially —
// comfortably the longest-running route in the app.
export const maxDuration = 800;

/**
 * Step 2 of full-site generation: build every planned page and create it.
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
  const { facts: rawFacts, pages: rawPages } = body as {
    facts?: unknown;
    pages?: { title?: string; slug?: string; brief?: string; isHome?: boolean }[];
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

  try {
    const result = await buildSiteFromPlan({ pages }, factsResult.data, tenantId, user.id);

    const created = result.pages.filter(p => p.pageId).length;
    if (created === 0) {
      return NextResponse.json(
        { error: result.pages.find(p => p.error)?.error ?? "AiCoder couldn't create any pages." },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
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
