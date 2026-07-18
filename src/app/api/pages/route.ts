import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

// Lists pages/posts for this tenant — used by the Item Box block (canvas
// preview of "pages"/"blog" sources) and the content picker's page/post
// search. Both consumers only need id/title/slug/type, kept minimal.
export async function GET(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "page" | "post" | omit for both
  const search = searchParams.get("search");

  let query = supabase
    .from("pages")
    .select("id, title, slug, type, excerpt, featured_image, status")
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .order("order_index")
    .limit(50);

  if (type === "page" || type === "post") query = query.eq("type", type);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
