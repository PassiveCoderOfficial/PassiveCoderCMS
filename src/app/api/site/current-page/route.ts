import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Resolves the page id for a slug on the live site's own tenant (via
// x-tenant-id, same resolution the [...slug]/page.tsx route uses) — backs
// the floating admin edit widget's "Edit this page" deep link. Auth is
// enforced by the RLS policy on pages itself (is_tenant_member OR public
// read of published pages) — no separate admin check needed here.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "home";

  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", slug)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .maybeSingle();

  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: page.id });
}
