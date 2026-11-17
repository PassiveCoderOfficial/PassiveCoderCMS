import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createProxyClient } from "@/lib/supabase/server";
import { LIVE_STATUSES, TENANT_COLS } from "@/lib/tenant/resolve";
import { PUBLIC_RENDER_HEADER, PUBLIC_RENDER_TOKEN } from "@/lib/supabase/public-render-token";

/*
 * GET /api/internal/tenant-map: every live site's routing row, for the
 * proxy's fallback when the database is unreachable (lib/tenant/resolve.ts).
 * Served from Next's Data Cache: refreshed every 5 minutes, and a failed
 * refresh keeps the previous list, which is the point. Server-only: the
 * caller must present the internal token.
 */
const loadTenants = unstable_cache(
  async () => {
    const { data, error } = await createProxyClient()
      .from("tenants")
      .select(TENANT_COLS)
      .in("status", LIVE_STATUSES)
      .limit(10000);
    if (error) throw new Error(error.message); // never cache a failed read
    const { data: aliases, error: aliasErr } = await createProxyClient()
      .from("tenant_alias_domains")
      .select(`domain,path_prefix,tenant:tenants!inner(${TENANT_COLS})`)
      .limit(5000);
    if (aliasErr) throw new Error(aliasErr.message);
    return { tenants: data ?? [], aliases: aliases ?? [] };
  },
  ["tenant-map-v2"],
  { revalidate: 300 },
);

export async function GET(req: NextRequest) {
  if (req.headers.get(PUBLIC_RENDER_HEADER) !== PUBLIC_RENDER_TOKEN) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    return NextResponse.json(await loadTenants(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
