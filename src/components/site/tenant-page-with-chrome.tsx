import { createClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { fetchGlobalLayout, toBlocks, shouldInjectPrefooter } from "@/lib/site/global-blocks";
import type { Block } from "@/types/cms";

/**
 * Renders a tenant's DB page (by slug) wrapped in the global header + footer.
 * Used by explicit (marketing) routes that win over the (site) catch-all on
 * tenant subdomains (contact, privacy, terms, refund, etc.) so they still show
 * the site chrome instead of 404ing.
 */
export async function TenantPageWithChrome({ tenantId, slug }: { tenantId: string; slug: string }) {
  const supabase = await createClient();
  const [{ data: page }, layout] = await Promise.all([
    supabase.from("pages").select("*").eq("slug", slug).eq("status", "published").eq("tenant_id", tenantId).maybeSingle(),
    fetchGlobalLayout(tenantId),
  ]);
  const blocks: Block[] = toBlocks(page?.blocks);
  const { header, footer, prefooter } = layout;
  const body = prefooter.length > 0 && shouldInjectPrefooter(blocks)
    ? [...blocks, ...prefooter]
    : blocks;
  return (
    <div className="min-h-screen">
      {header.length > 0 && <PageRenderer blocks={header} />}
      <PageRenderer blocks={body} />
      {footer.length > 0 && <PageRenderer blocks={footer} />}
    </div>
  );
}
