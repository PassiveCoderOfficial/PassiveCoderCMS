import { createClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import type { Block } from "@/types/cms";

function toBlocks(v: unknown): Block[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as Block[];
  if (typeof v === "object" && (v as Record<string, unknown>).type) return [v as Block];
  return [];
}

/**
 * Renders a tenant's DB page (by slug) wrapped in the global header + footer.
 * Used by explicit (marketing) routes that win over the (site) catch-all on
 * tenant subdomains (contact, privacy, terms, refund, etc.) so they still show
 * the site chrome instead of 404ing.
 */
export async function TenantPageWithChrome({ tenantId, slug }: { tenantId: string; slug: string }) {
  const supabase = await createClient();
  const [{ data: page }, { data: identity }] = await Promise.all([
    supabase.from("pages").select("*").eq("slug", slug).eq("status", "published").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("site_identity").select("global_header, global_footer").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  const blocks = toBlocks(page?.blocks);
  const header = toBlocks(identity?.global_header);
  const footer = toBlocks(identity?.global_footer);
  return (
    <div className="min-h-screen">
      {header.length > 0 && <PageRenderer blocks={header} />}
      <PageRenderer blocks={blocks} />
      {footer.length > 0 && <PageRenderer blocks={footer} />}
    </div>
  );
}
