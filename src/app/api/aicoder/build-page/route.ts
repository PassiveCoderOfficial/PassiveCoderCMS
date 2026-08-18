import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { businessFactsSchema } from "@/lib/aicoder/brief";
import { buildPageFromPlan } from "@/lib/aicoder/build-page";
import { isSupportedBlockType } from "@/lib/aicoder/schemas";
import type { PageSection } from "@/lib/aicoder/plan";

// A dozen sequential model calls comfortably exceeds the default serverless
// timeout — this is the one AiCoder route that genuinely needs the headroom.
export const maxDuration = 300;

/**
 * Step 2 of full-page generation: run an (optionally user-edited) plan and
 * return the generated blocks as a PREVIEW. Nothing is written to the page —
 * the builder UI applies them through the normal store path, so undo/redo and
 * the page-snapshot trigger cover the result exactly as they cover hand edits.
 *
 * The plan comes back from the client rather than being re-planned server-side
 * so the user can delete or reword sections before paying for them.
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
  const { facts: rawFacts, sections: rawSections } = body as {
    facts?: unknown;
    sections?: { blockType?: string; brief?: string; variantKey?: string }[];
  };

  // Facts round-trip through the client, so re-validate rather than trust them —
  // they carry the "never claim X" constraints that every generation depends on.
  const factsResult = businessFactsSchema.safeParse(rawFacts);
  if (!factsResult.success) {
    return NextResponse.json({ error: "Invalid business facts — re-plan the page." }, { status: 400 });
  }

  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    return NextResponse.json({ error: "No sections to build" }, { status: 400 });
  }
  if (rawSections.length > 16) {
    return NextResponse.json({ error: "Too many sections — 16 is the maximum for one page." }, { status: 400 });
  }

  const sections: PageSection[] = [];
  for (const s of rawSections) {
    if (!s.blockType || !isSupportedBlockType(s.blockType)) {
      return NextResponse.json({ error: `Unsupported section type: ${s.blockType}` }, { status: 400 });
    }
    if (!s.brief?.trim()) {
      return NextResponse.json({ error: "Every section needs a brief" }, { status: 400 });
    }
    sections.push({
      blockType: s.blockType,
      brief: s.brief.trim().slice(0, 600),
      variantKey: s.variantKey,
    });
  }

  try {
    const result = await buildPageFromPlan(sections, factsResult.data, tenantId, user.id);

    if (result.blocks.length === 0) {
      const firstError = result.sections.find(s => s.error)?.error;
      return NextResponse.json(
        { error: firstError ?? "AiCoder couldn't generate any sections for this page." },
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
      { error: err instanceof Error ? err.message : "AiCoder page generation failed" },
      { status: 500 },
    );
  }
}
