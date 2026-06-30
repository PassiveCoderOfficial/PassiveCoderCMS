import { createAdminClient } from "@/lib/supabase/server";
import type { Block } from "@/types/cms";

/** Normalize a stored value (single Block object OR Block[]) into Block[]. */
export function toBlocks(val: unknown): Block[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as Block[];
  if (typeof val === "object" && (val as Record<string, unknown>).type) return [val as Block];
  return [];
}

export interface GlobalLayout {
  header: Block[];
  footer: Block[];
  prefooter: Block[];
}

/** Fetch a tenant's global header / footer / pre-footer blocks. */
export async function fetchGlobalLayout(tenantId: string | null | undefined): Promise<GlobalLayout> {
  if (!tenantId) return { header: [], footer: [], prefooter: [] };
  const admin = await createAdminClient();
  const { data } = await admin
    .from("site_identity")
    .select("global_header, global_footer, global_prefooter")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return {
    header: toBlocks(data?.global_header),
    footer: toBlocks(data?.global_footer),
    prefooter: toBlocks(data?.global_prefooter),
  };
}

/**
 * Skip the global pre-footer on pages that already contain their own contact block
 * (e.g. the dedicated /contact page) so we don't render it twice.
 */
export function shouldInjectPrefooter(pageBlocks: Block[]): boolean {
  return !pageBlocks.some((b) => b.type === "contact");
}
