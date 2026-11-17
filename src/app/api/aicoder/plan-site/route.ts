import { NextResponse } from "next/server";
import { isViewOnlyMember } from "@/lib/auth/site-write";
import { aiFeatureAvailable } from "@/lib/ai/provider";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { parseBrief, planSite } from "@/lib/aicoder/plan";
import { renderProfileBrief, mergeBrief } from "@/lib/aicoder/profile-brief";
import { getCreditStatus } from "@/lib/ai/credits";
import { CREDIT_COSTS } from "@/lib/ai/credit-costs";

// Model calls regularly exceed the platform's default function timeout, which
// surfaces in the UI as a bare "upstream request failed" string.
export const maxDuration = 300;

/** Rough per-page section count, used only to show an up-front cost estimate.
 *  The real number comes from each page's own plan at build time. */
const EST_SECTIONS_PER_PAGE = 9;

/**
 * Step 1 of full-site generation: turn a brief into a page list.
 *
 * Free, like page planning — and more important here, because a site run is
 * 400-600 credits and the user needs to see and trim the page list before
 * committing to that.
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
  const { brief } = body as { brief?: string };

  if (!brief?.trim()) {
    return NextResponse.json({ error: "Describe the website you want AiCoder to build" }, { status: 400 });
  }
  if (brief.length > 24_000) {
    return NextResponse.json({ error: "That brief is too long — trim it to about 20,000 characters." }, { status: 400 });
  }

  try {
    // Seed the run with the stored business profile, so the owner does not
    // retype their name, services and contact details on every run.
    const fullBrief = mergeBrief(await renderProfileBrief(tenantId), brief);
    const facts = await parseBrief(fullBrief);
    const plan = await planSite(facts, brief);

    const status = await getCreditStatus(tenantId);
    const estimate = plan.pages.length * EST_SECTIONS_PER_PAGE * CREDIT_COSTS.section;
    const available = status?.unlimited ? estimate : status?.left ?? 0;

    return NextResponse.json({
      facts,
      plan,
      estimate,
      available,
      affordable: !!status?.unlimited || available >= estimate,
    });
  } catch (err) {
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AiCoder couldn't plan this site" },
      { status: 500 },
    );
  }
}
