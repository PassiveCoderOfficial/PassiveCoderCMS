"use client";

import { createClient } from "@/lib/supabase/client";

// ─── Shared page/post status + trash helpers (build once, reuse everywhere) ──
// Used by both /dashboard/pages and /dashboard/posts row components. Trash is
// deleted_at IS NOT NULL, not a status value — keeps the pages_status_check
// constraint and every existing status branch untouched.

export async function updateStatus(id: string, status: string) {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };
  if (status === "published") updates.published_at = new Date().toISOString();
  return supabase.from("pages").update(updates).eq("id", id);
}

export async function updateScheduledAt(id: string, isoDateTime: string) {
  const supabase = createClient();
  const picked = new Date(isoDateTime);
  const now = new Date();
  if (picked.getTime() > now.getTime()) {
    // Future time: schedule it — the publish-scheduled cron flips this to
    // published once scheduled_at <= now.
    return supabase.from("pages").update({ status: "scheduled", scheduled_at: picked.toISOString() }).eq("id", id);
  }
  // Past/now: just adjust the displayed timestamp, don't silently publish.
  return supabase.from("pages").update({ published_at: picked.toISOString() }).eq("id", id);
}

export async function moveToTrash(id: string) {
  const supabase = createClient();
  return supabase.from("pages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
}

export async function restoreFromTrash(id: string) {
  const supabase = createClient();
  return supabase.from("pages").update({ deleted_at: null }).eq("id", id);
}

export async function deletePermanently(id: string) {
  const supabase = createClient();
  return supabase.from("pages").delete().eq("id", id);
}
