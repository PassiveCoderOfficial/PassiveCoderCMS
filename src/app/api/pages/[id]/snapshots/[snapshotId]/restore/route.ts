import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; snapshotId: string }> }) {
  const { id: pageId, snapshotId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  const { data: page } = await admin.from("pages").select("id, blocks, title").eq("id", pageId).eq("tenant_id", tenantId).maybeSingle();
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const { data: snapshot } = await admin
    .from("page_snapshots")
    .select("blocks")
    .eq("id", snapshotId)
    .eq("page_id", pageId)
    .maybeSingle();
  if (!snapshot) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });

  // Explicitly snapshot the current (pre-restore) state as reason='restore'
  // before overwriting — the 10-minute trigger dedup window could otherwise
  // silently skip capturing it if a save happened moments ago, and restoring
  // should always be undoable regardless of that window.
  await admin.from("page_snapshots").insert({
    tenant_id: tenantId,
    page_id: pageId,
    blocks: page.blocks,
    title: page.title,
    reason: "restore",
    created_by: user.id,
  });

  const { error } = await admin
    .from("pages")
    .update({ blocks: snapshot.blocks, updated_at: new Date().toISOString() })
    .eq("id", pageId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, blocks: snapshot.blocks });
}
