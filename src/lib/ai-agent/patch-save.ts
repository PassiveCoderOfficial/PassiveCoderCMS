import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The in-app agent edits one section by proposing save_page_blocks with just
 * that section. The tool replaces the whole block list (and now refuses to
 * drop sections silently), so a one-field edit would either delete the rest
 * of the page or fail at Confirm.
 *
 * Before the proposal is shown, expand a partial list into a patch: every
 * existing block stays in its current position, blocks the agent sent replace
 * or merge into theirs, and genuinely new blocks are appended. An agent that
 * really means to remove sections must say so with removeOmitted: true.
 */
export async function expandPartialSave(
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  tenantId: string,
): Promise<Record<string, unknown>> {
  const pageId = args.pageId as string | undefined;
  const sent = args.blocks as Array<Record<string, unknown>> | undefined;
  if (!pageId || !Array.isArray(sent) || args.removeOmitted) return args;

  const { data: page } = await supabase
    .from("pages")
    .select("blocks, draft_blocks")
    .eq("id", pageId)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  const existing = ((page?.draft_blocks ?? page?.blocks ?? []) as Array<{ id: string }>);
  if (existing.length === 0) return args;

  const sentIds = new Set(sent.map(b => b.id as string));
  if (existing.every(b => sentIds.has(b.id))) return args; // already complete

  const byId = new Map(sent.map(b => [b.id as string, b]));
  const merged = existing.map(b => {
    const s = byId.get(b.id);
    if (!s) return { id: b.id, _merge: true };
    // A sent block without a type is a field patch — merge it into the current one.
    return s.type ? s : { ...s, _merge: true };
  });
  const existingIds = new Set(existing.map(b => b.id));
  for (const s of sent) if (!existingIds.has(s.id as string)) merged.push(s);

  return { ...args, blocks: merged };
}
