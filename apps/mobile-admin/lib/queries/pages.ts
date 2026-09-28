import { supabase } from "../supabase";
import type { Block, Page } from "../types";

export type PageListItem = Pick<Page, "id" | "title" | "slug" | "type" | "status" | "order_index" | "updated_at">;

/**
 * Lists pages for a tenant. RLS already scopes rows to tenants the caller
 * belongs to, but we additionally filter by tenant_id here as defense in
 * depth — showing a tenant admin the wrong site's pages would be confusing
 * UX even in scenarios where RLS alone would already have blocked leakage.
 */
export async function listPages(tenantId: string): Promise<PageListItem[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, title, slug, type, status, order_index, updated_at")
    .eq("tenant_id", tenantId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PageListItem[];
}

export async function getPage(pageId: string): Promise<Page> {
  const { data, error } = await supabase.from("pages").select("*").eq("id", pageId).single();
  if (error) throw error;
  return data as Page;
}

export async function updatePageMeta(
  pageId: string,
  patch: Partial<Pick<Page, "title" | "status" | "excerpt" | "seo">>
): Promise<void> {
  const { error } = await supabase.from("pages").update(patch).eq("id", pageId);
  if (error) throw error;
}

/**
 * Page saves go through the same draft/publish RPCs as the web editor
 * (cms/supabase/migrations/105_page_drafts.sql). For a live (published) page
 * a save lands in draft_blocks and does NOT change the live site until
 * publishPage; for any other page it writes blocks directly. expectedRev is
 * the draft_rev this editor loaded — if someone else saved since, the server
 * raises "page_conflict" instead of silently overwriting their work.
 */
export class PageConflictError extends Error {
  constructor() {
    super("This page was changed somewhere else since you opened it.");
    this.name = "PageConflictError";
  }
}

function rethrow(error: { message?: string }): never {
  if (error.message?.includes("page_conflict")) throw new PageConflictError();
  throw error;
}

export async function savePageBlocks(
  pageId: string,
  blocks: Block[],
  expectedRev: number | null,
): Promise<{ rev: number; hasDraft: boolean }> {
  const { data, error } = await supabase.rpc("save_page_blocks", { p_id: pageId, p_blocks: blocks, p_expected_rev: expectedRev });
  if (error) rethrow(error);
  const row = (Array.isArray(data) ? data[0] : data) as { rev: number; has_draft: boolean };
  return { rev: row.rev, hasDraft: row.has_draft };
}

export async function publishPage(pageId: string, blocks: Block[], expectedRev: number | null): Promise<{ rev: number }> {
  const { data, error } = await supabase.rpc("publish_page", { p_id: pageId, p_blocks: blocks, p_expected_rev: expectedRev });
  if (error) rethrow(error);
  const row = (Array.isArray(data) ? data[0] : data) as { rev: number };
  return { rev: row.rev };
}

export async function discardPageDraft(pageId: string): Promise<{ rev: number; blocks: Block[] }> {
  const { data, error } = await supabase.rpc("discard_page_draft", { p_id: pageId });
  if (error) rethrow(error);
  const row = (Array.isArray(data) ? data[0] : data) as { rev: number; blocks: Block[] };
  return { rev: row.rev, blocks: row.blocks ?? [] };
}
