import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { isSupportedBlockType } from "@/lib/aicoder/schemas";
import { generateBlockContent, AiCoderError } from "@/lib/aicoder/generate";
import { mergeContentIntoBlock } from "@/lib/aicoder/merge";
import { requireModule } from "@/lib/modules/resolve-modules";

/**
 * Preview-only: generates a block via AiCoder and returns it WITHOUT writing
 * to the page. The caller (page builder UI) shows this as a proposal the
 * user must explicitly apply via /api/aicoder/apply-block — AiCoder never
 * writes to a live page directly.
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
  const { blockType, instruction } = body as { blockType?: string; instruction?: string };

  if (!blockType || !isSupportedBlockType(blockType)) {
    return NextResponse.json({ error: "Unsupported block type for AiCoder" }, { status: 400 });
  }
  if (!instruction?.trim()) {
    return NextResponse.json({ error: "Missing instruction" }, { status: 400 });
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
    return NextResponse.json({ block });
  } catch (err) {
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : err.code === "invalid_output" ? 502 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "AiCoder generation failed" }, { status: 500 });
  }
}
