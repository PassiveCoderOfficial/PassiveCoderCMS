import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { parseBrief, planSite } from "@/lib/aicoder/plan";
import { renderProfileBrief, mergeBrief } from "@/lib/aicoder/profile-brief";
import { getQuotaStatus } from "@/lib/aicoder/quota";

/** Rough per-page section count, used only to show an up-front cost estimate.
 *  The real number comes from each page's own plan at build time. */
const EST_SECTIONS_PER_PAGE = 9;

/**
 * Step 1 of full-site generation: turn a brief into a page list.
 *
 * Free, like page planning — and more important here, because a site run is
 * 40-60 generations and the user needs to see and trim the page list before
 * committing to that.
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

    const status = await getQuotaStatus(tenantId);
    const available = status
      ? Math.max(0, status.monthlyIncluded - status.usedThisMonth) + status.purchasedRemaining
      : 0;
    const estimate = plan.pages.length * EST_SECTIONS_PER_PAGE;

    return NextResponse.json({
      facts,
      plan,
      estimate,
      available,
      affordable: available >= estimate,
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
