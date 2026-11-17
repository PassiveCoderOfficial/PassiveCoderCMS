import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@/types/cms";

/**
 * Header for built-in routes (/book etc.) on sites that keep their menu as a
 * navigation block inside each page instead of a global header. Without this
 * those routes render with no header at all and visitors are stranded.
 * Returns [] when the site has a global header (the layout already shows it).
 */
export async function getFallbackHeader(admin: SupabaseClient, tenantId: string): Promise<Block[]> {
  const [{ data: identity }, { data: home }] = await Promise.all([
    admin.from("site_identity").select("global_header").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("pages").select("blocks").eq("tenant_id", tenantId).eq("slug", "home")
      .eq("status", "published").is("deleted_at", null).maybeSingle(),
  ]);
  const gh = identity?.global_header;
  if (Array.isArray(gh) ? gh.length > 0 : !!gh) return [];
  const nav = ((home?.blocks as Block[] | null) ?? []).find((b) => b.type === "navigation" && b.visible !== false);
  return nav ? [{ ...nav, order: 0 }] : [];
}
