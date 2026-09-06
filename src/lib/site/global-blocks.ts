import { createAdminClient } from "@/lib/supabase/server";
import type { Block, ContainerBlockProps } from "@/types/cms";

/**
 * True when this block is site-chrome — either the legacy `navigation`/
 * `footer` block, or a `container` built from the new independent header
 * sub-blocks (header_logo/header_nav/etc, see project_block_editor_bugs
 * memory). Pages that also render the tenant's global_header/global_footer
 * separately must strip blocks like this from their own body, or the header
 * renders twice — once from global_header, once as page content.
 *
 * Found live (2026-09-06) after migrating navigation blocks to the new
 * container model: the callers of this used to check `b.type ===
 * "navigation"` directly, a check that stopped matching the instant a nav
 * block became a `container` — 23 tenants / 173 pages that had BOTH a
 * global_header AND their own per-page nav block started double-rendering
 * their header on every page, live in production. Structural detection
 * (does this container hold a header sub-block) instead of a type-string
 * check is what survives that kind of migration going forward.
 */
export function isChromeBlock(b: Block, kind: "header" | "footer"): boolean {
  if (kind === "header" && b.type === "navigation") return true;
  if (kind === "footer" && b.type === "footer") return true;
  if (b.type !== "container") return false;
  const container = b as ContainerBlockProps;
  const subTypes = new Set(
    container.data.columns?.flatMap((c) => c.blocks?.map((cb) => cb.type) ?? []) ?? [],
  );
  if (kind === "header") {
    return subTypes.has("header_logo") || subTypes.has("header_nav") || subTypes.has("header_cta")
      || subTypes.has("header_cart") || subTypes.has("header_account");
  }
  // No independent footer-column sub-blocks exist yet (only nav-shaped ones
  // reuse header_logo/header_nav) — a migrated footer container would still
  // show up under "header" sub-types today, which is fine: this file only
  // ever gets asked about "footer" for the literal `footer` block type.
  return false;
}

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
