import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { isSupportedBlockType } from "@/lib/aicoder/schemas";
import { generateBlockContent, AiCoderError } from "@/lib/aicoder/generate";
import { mergeContentIntoBlock, resolveBlockImages } from "@/lib/aicoder/merge";
import { businessFactsSchema } from "@/lib/aicoder/brief";
import { reserveGeneration, refundGeneration, AiCoderQuotaError } from "@/lib/aicoder/quota";

/**
 * Regenerates ONE section of an already-built page.
 *
 * Without this, a single weak or failed section meant rebuilding the whole
 * page — paying a dozen generations to fix one, and discarding eleven sections
 * the user was happy with. Carries the same BusinessFacts as the original run
 * so the regenerated section keeps the brief's constraints (the "never claim
 * licensed" rules) rather than drifting from the rest of the page.
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
  const { blockType, brief, variantKey, facts: rawFacts } = body as {
    blockType?: string; brief?: string; variantKey?: string; facts?: unknown;
  };

  if (!blockType || !isSupportedBlockType(blockType)) {
    return NextResponse.json({ error: "Unsupported block type" }, { status: 400 });
  }
  if (!brief?.trim()) {
    return NextResponse.json({ error: "Missing section brief" }, { status: 400 });
  }

  // Facts are optional — a section regenerated outside a full-page run has
  // none — but when present they must be valid, since they carry the
  // constraints every other section on the page was written against.
  const factsResult = rawFacts ? businessFactsSchema.safeParse(rawFacts) : null;
  if (rawFacts && !factsResult?.success) {
    return NextResponse.json({ error: "Invalid business facts" }, { status: 400 });
  }

  let quotaSource: "quota" | "purchased";
  try {
    quotaSource = await reserveGeneration(tenantId, blockType, user.id);
  } catch (err) {
    if (err instanceof AiCoderQuotaError) {
      return NextResponse.json({ error: err.message, code: "quota_exhausted" }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to check AiCoder usage" }, { status: 500 });
  }

  try {
    const content = await generateBlockContent(
      blockType,
      "",
      brief,
      factsResult?.success ? factsResult.data : undefined,
    );
    const block = mergeContentIntoBlock(blockType, content, variantKey);
    const { usedPlaceholders } = await resolveBlockImages(block, content);
    return NextResponse.json({ block, usedPlaceholders });
  } catch (err) {
    await refundGeneration(tenantId, quotaSource).catch(() => {});
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't regenerate this section" },
      { status: 500 },
    );
  }
}
