/**
 * Where the site's menus show on the live site ("Used in"), for the
 * builder's in-place menu editor (menus P3). The client combines these
 * readers with the menu list (modules/navigation/menu-usage menuUsage).
 */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireTenantAccess } from "../access";
import { loadMenuReaders } from "@/lib/site/menu-readers";

export async function GET() {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { readers } = await loadMenuReaders(ctx.admin as unknown as SupabaseClient, ctx.tenantId);
  return NextResponse.json({ readers });
}
