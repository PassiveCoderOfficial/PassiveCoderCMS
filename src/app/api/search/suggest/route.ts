import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";
import { effectiveSearchTypes, searchSite } from "@/lib/search/site-search";
import { isEcomMarketplace } from "@/modules/registry/marketplace/is-marketplace";

/**
 * Live search suggestions for the site being viewed.
 * GET ?q=term&types=product,category&limit=5
 */
export async function GET(req: Request) {
  const tenantId = (await headers()).get("x-tenant-id");
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  if (!tenantId || q.length < 2) return NextResponse.json({ results: [] });
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 5, 1), 10);
  const modules = await resolveEnabledModules(tenantId);
  const types = effectiveSearchTypes(sp.get("types")?.split(","), !!modules.ecommerce);
  const admin = await createAdminClient();
  const marketplace = await isEcomMarketplace(tenantId);
  const results = (await searchSite(admin, tenantId, q, types, limit, { marketplace })).slice(0, limit);
  return NextResponse.json({ results, types }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
