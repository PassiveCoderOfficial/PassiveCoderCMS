import { NextResponse } from "next/server";
import { isViewOnlyMember } from "@/lib/auth/site-write";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { requireModule } from "@/lib/modules/resolve-modules";
import { callModel, AiCoderError } from "@/lib/aicoder/generate";
import { parseBrief } from "@/lib/aicoder/plan";
import { renderProfileBrief, mergeBrief } from "@/lib/aicoder/profile-brief";
import { renderConstraints, renderContext } from "@/lib/aicoder/brief";
import { sectionByKey } from "@/lib/aicoder/sections/registry";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";

// Model calls regularly exceed the platform's default function timeout, which
// surfaces in the UI as a bare "upstream request failed" string.
export const maxDuration = 300;

/**
 * Generates content for ONE dashboard section (services, features,
 * testimonials, SEO) from the tenant's stored business profile plus whatever
 * extra instruction the owner typed.
 *
 * Preview-only, like every other AiCoder path: this returns a proposal and
 * writes nothing. The client shows it, the owner accepts or discards, and only
 * then does the section's own save path run. Generating straight into a live
 * services list would be the one AiCoder surface that could silently rewrite a
 * customer's real content.
 */
export async function POST(req: Request) {
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
  const { section: sectionKey, instruction } = body as { section?: string; instruction?: string };

  const def = sectionKey ? sectionByKey(sectionKey) : null;
  if (!def) return NextResponse.json({ error: "Unknown section" }, { status: 400 });

  // The stored profile is the whole point — the owner shouldn't have to retype
  // their business details to get a services list. An extra instruction is
  // optional refinement on top, not a requirement.
  const profileBrief = await renderProfileBrief(tenantId);
  const fullBrief = mergeBrief(profileBrief, instruction ?? "");
  if (!fullBrief.trim()) {
    return NextResponse.json(
      { error: "Nothing to work from yet — fill in your business profile, or describe what you want here." },
      { status: 400 },
    );
  }

  let reservation: CreditReservation;
  try {
    reservation = await reserveCredits(tenantId, "section", { userId: user.id, detail: `section:${def.key}` });
  } catch (err) {
    if (err instanceof AiCreditsError) {
      return NextResponse.json({ error: err.message, code: "quota_exhausted" }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to check AiCoder usage" }, { status: 500 });
  }

  try {
    // Two calls: extract facts once (so the same never-claim-X constraints that
    // guard page generation also guard this), then write the section.
    const facts = await parseBrief(fullBrief);

    const system = [
      "You are AiCoder, writing content for one section of a small business's website dashboard.",
      "Output MUST be valid JSON matching the provided schema exactly. No markdown, no commentary.",
      "Keep copy concrete and specific to the business described. Avoid generic filler.",
      def.promptHint,
      renderConstraints(facts),
    ].join(" ");

    const userPrompt = [
      `Business context:\n${renderContext(facts)}`,
      "",
      instruction?.trim() ? `Additional instruction from the owner: ${instruction.trim()}` : "",
    ].filter(Boolean).join("\n");

    const content = await callModel(def.schema, system, userPrompt, 1800);
    return NextResponse.json({ section: def.key, content });
  } catch (err) {
    await refundCredits(reservation).catch(() => {});
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AiCoder couldn't generate this" },
      { status: 500 },
    );
  }
}
