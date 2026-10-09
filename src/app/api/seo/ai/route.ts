import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { AiCoderQuotaError } from "@/lib/aicoder/quota";
import { applySeo, proposeSeo, seoFreeRunAvailable } from "@/lib/seo/ai-meta";

export const maxDuration = 120;

/** Whether this site's free AI SEO run is still unused. */
export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  return NextResponse.json({ freeAvailable: await seoFreeRunAvailable(a.admin, a.tenantId) });
}

/** propose: AI-written titles/descriptions to review. apply: save the ones the owner kept. */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const body = await req.json().catch(() => ({})) as { action?: string; site?: { title?: string; description?: string }; pages?: { id: string; title?: string; description?: string }[] };
  try {
    if (body.action === "propose") return NextResponse.json(await proposeSeo(a.admin, a.tenantId, a.userId));
    if (body.action === "apply") return NextResponse.json({ saved: await applySeo(a.admin, a.tenantId, { site: body.site, pages: body.pages }) });
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof AiCoderQuotaError) return NextResponse.json({ error: `${e.message} Your free SEO run is used; more runs use AiCoder generations.` }, { status: 402 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 502 });
  }
}
