import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** GET /api/results/courses-public[?featured=1&limit=n] — course list for the
 *  results_courses block, scoped by the subdomain-injected tenant header. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const sp = new URL(req.url).searchParams;
  const admin = await createAdminClient();
  let q = admin.from("results_courses").select("id, name, slug, code, level, duration, summary, image_url, page_url, featured")
    .eq("tenant_id", tenantId).order("sort_order").order("name");
  if (sp.get("featured") === "1") q = q.eq("featured", true);
  const limit = Number(sp.get("limit"));
  if (limit > 0) q = q.limit(Math.min(limit, 100));
  const { data } = await q;
  return NextResponse.json(data ?? []);
}
