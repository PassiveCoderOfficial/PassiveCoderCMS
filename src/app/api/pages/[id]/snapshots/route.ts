import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: pageId } = await params;
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  // Confirm the page actually belongs to this tenant before listing its
  // history — RLS on page_snapshots already scopes by tenant_id, but this
  // gives a clean 404 instead of an empty list for a wrong/foreign page id.
  const { data: page } = await admin.from("pages").select("id").eq("id", pageId).eq("tenant_id", tenantId).maybeSingle();
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const { data, error } = await admin
    .from("page_snapshots")
    // kind: "live" = published content before it changed, "draft" =
    // unpublished edits before they were overwritten (migration 170).
    .select("id, title, reason, kind, created_at, created_by")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ snapshots: data ?? [] });
}
