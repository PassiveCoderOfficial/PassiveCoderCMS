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
 * Overwrites a page's blocks jsonb column. tenant_id filter is defense in
 * depth (matches listPages/getPage convention) — RLS already scopes writes
 * to tenants the caller belongs to.
 */
export async function updatePageBlocks(pageId: string, tenantId: string, blocks: Block[]): Promise<void> {
  const { error } = await supabase
    .from("pages")
    .update({ blocks, updated_at: new Date().toISOString() })
    .eq("id", pageId)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}
