/**
 * The site's automatic menu (menus P3): its published top-level pages, as
 * a header with no saved menu and no typed links shows them on the live
 * site. The builder previews it on the canvas and saves it as a real menu
 * the first time the owner edits it.
 */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireTenantAccess } from "../access";
import { loadDefaultMenu } from "@/lib/site/default-menu";

export async function GET() {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await loadDefaultMenu(ctx.admin as unknown as SupabaseClient, ctx.tenantId);
  return NextResponse.json({ items });
}
