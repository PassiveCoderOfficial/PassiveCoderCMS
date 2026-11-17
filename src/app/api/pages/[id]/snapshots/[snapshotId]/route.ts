import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";

/** One history snapshot with its blocks (the app compares it with the current page). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; snapshotId: string }> }) {
  const { id: pageId, snapshotId } = await params;
  const caller = await getApiCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const { data: page } = await admin.from("pages").select("id").eq("id", pageId).eq("tenant_id", caller.tenantId).maybeSingle();
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  const { data: snap } = await admin.from("page_snapshots").select("id, title, reason, kind, blocks, created_at").eq("id", snapshotId).eq("page_id", pageId).maybeSingle();
  if (!snap) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  return NextResponse.json({ snapshot: snap });
}
