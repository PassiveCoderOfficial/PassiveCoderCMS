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

  const { data: page } = await admin.from("pages").select("id, blocks, draft_blocks, title").eq("id", pageId).eq("tenant_id", tenantId).maybeSingle();
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
    // What the editor was showing — unpublished edits if any, not just
    // the live content — so the restore itself is undoable.
    blocks: page.draft_blocks ?? page.blocks,
    title: page.title,
    reason: "restore",
    created_by: user.id,
  });

  // Same save path as the editor (migration 105): on a LIVE page the
  // restored version lands in the draft, so nothing reaches visitors until
  // Publish — a restore is still an edit you should get to review. On a
  // draft/unpublished page it's written directly, as before. Forced (no
  // expected revision): restoring is an explicit override.
  const { data: saved, error } = await admin.rpc("save_page_blocks", {
    p_id: pageId,
    p_blocks: snapshot.blocks,
    p_expected_rev: null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const row = (Array.isArray(saved) ? saved[0] : saved) as { has_draft?: boolean } | null;
  return NextResponse.json({ ok: true, blocks: snapshot.blocks, asDraft: !!row?.has_draft });
}
