import { NextRequest, NextResponse } from "next/server";
import { invalidateSites } from "@/lib/supabase/public-cache";
import { PUBLIC_RENDER_HEADER, PUBLIC_RENDER_TOKEN } from "@/lib/supabase/public-render-token";

/*
 * POST /api/internal/invalidate { tenantIds?: string[] }
 *
 * Seed and fix-up scripts write to Supabase directly, which the app never
 * sees, so their changes would wait up to an hour in the public-site cache.
 * Scripts call this afterwards. Server-only: the caller presents the
 * internal token (sha256 of the service-role key + "|public-render", first
 * 32 hex chars; see public-render-token.ts). No ids = every site.
 */
export async function POST(req: NextRequest) {
  if (req.headers.get(PUBLIC_RENDER_HEADER) !== PUBLIC_RENDER_TOKEN) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({})) as { tenantIds?: unknown };
  const ids = Array.isArray(body.tenantIds) ? body.tenantIds.filter((x): x is string => typeof x === "string") : [];
  invalidateSites(ids);
  return NextResponse.json({ ok: true, expired: ids.length || "all" });
}
