import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { parseBrief, planPage } from "@/lib/aicoder/plan";
import { renderProfileBrief, mergeBrief } from "@/lib/aicoder/profile-brief";
import { assertBatchAffordable, AiCoderQuotaError } from "@/lib/aicoder/quota";

/**
 * Step 1 of full-page generation: turn a free-form brief into a section plan.
 *
 * Deliberately does NOT consume quota. Planning costs two cheap model calls
 * while the expensive part is the dozen block generations that follow, and the
 * user needs to see (and edit) the plan before committing to those. Charging
 * for a plan the user then discards would make iterating on the brief feel
 * expensive, which is exactly when iterating is most useful.
 *
 * It does check affordability up front, so a tenant is told "this page needs 12
 * generations, you have 4" before building rather than halfway through.
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
    return NextResponse.json({ error: "Describe the page you want AiCoder to build" }, { status: 400 });
  }
  if (brief.length > 24_000) {
    return NextResponse.json({ error: "That brief is too long — trim it to about 20,000 characters." }, { status: 400 });
  }

  try {
    // Seed the run with the stored business profile, so the owner does not
    // retype their name, services and contact details on every run.
    const fullBrief = mergeBrief(await renderProfileBrief(tenantId), brief);
    const facts = await parseBrief(fullBrief);
    const plan = await planPage(facts, brief, "home");

    // Advisory only — the real per-generation gate is inside the build loop.
    let affordable = true;
    let quotaMessage: string | null = null;
    try {
      await assertBatchAffordable(tenantId, plan.sections.length);
    } catch (err) {
      if (err instanceof AiCoderQuotaError) {
        affordable = false;
        quotaMessage = err.message;
      } else {
        throw err;
      }
    }

    return NextResponse.json({ facts, plan, affordable, quotaMessage });
  } catch (err) {
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AiCoder couldn't plan this page" },
      { status: 500 },
    );
  }
}
