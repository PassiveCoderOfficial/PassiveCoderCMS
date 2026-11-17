import { NextResponse } from "next/server";
import { isViewOnlyMember } from "@/lib/auth/site-write";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { isSupportedBlockType } from "@/lib/aicoder/schemas";
import { generateBlockContent, AiCoderError } from "@/lib/aicoder/generate";
import { mergeContentIntoBlock, resolveBlockImages } from "@/lib/aicoder/merge";
import { requireModule } from "@/lib/modules/resolve-modules";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";

// Model calls regularly exceed the platform's default function timeout, which
// surfaces in the UI as a bare "upstream request failed" string.
export const maxDuration = 300;

/**
 * Preview-only: generates a block via AiCoder and returns it WITHOUT writing
 * to the page. The caller (page builder UI) shows this as a proposal the
 * user must explicitly apply via /api/aicoder/apply-block — AiCoder never
 * writes to a live page directly.
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
  const { blockType, instruction } = body as { blockType?: string; instruction?: string };

  if (!blockType || !isSupportedBlockType(blockType)) {
    return NextResponse.json({ error: "Unsupported block type for AiCoder" }, { status: 400 });
  }
  if (!instruction?.trim()) {
    return NextResponse.json({ error: "Missing instruction" }, { status: 400 });
  }

  // Reserve quota BEFORE calling the model — a denied request costs nothing.
  let reservation: CreditReservation;
  try {
    reservation = await reserveCredits(tenantId, "section", { userId: user.id, detail: blockType });
  } catch (err) {
    if (err instanceof AiCreditsError) {
      return NextResponse.json({ error: err.message, code: "quota_exhausted" }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to check AiCoder usage" }, { status: 500 });
  }

  const admin = await createAdminClient();
  const { data: settings } = await admin
    .from("site_settings")
    .select("site_name, site_description")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const businessContext = [settings?.site_name, settings?.site_description].filter(Boolean).join(" — ");

  try {
    const content = await generateBlockContent(blockType, businessContext, instruction);
    const block = mergeContentIntoBlock(blockType, content);
    const { usedPlaceholders } = await resolveBlockImages(block, content);
    return NextResponse.json({ block, usedPlaceholders });
  } catch (err) {
    // Generation failed after quota was already reserved — refund it so a
    // model/upstream failure doesn't silently cost the tenant a generation
    // they never actually got.
    await refundCredits(reservation).catch(() => {});
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : err.code === "invalid_output" ? 502 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "AiCoder generation failed" }, { status: 500 });
  }
}
