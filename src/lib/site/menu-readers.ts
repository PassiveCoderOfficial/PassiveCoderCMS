import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { menuReaders, type MenuReaders } from "@/modules/navigation/menu-usage";
import { resolveLiveHeader } from "@/modules/header-studio/doc";
import { menuRefs } from "@/modules/header-studio/model";
import { resolveLiveFooter } from "@/modules/footer-studio/doc";
import { footerMenuRefs } from "@/modules/footer-studio/model";

/**
 * Everything on the live site that reads menus ("Used in"), for the
 * Navigation screen and the builder's in-place menu editor (menus P3).
 * Also returns the classic header/footer trees the Navigation screen needs.
 */
export async function loadMenuReaders(admin: SupabaseClient, tenantId: string): Promise<{ readers: MenuReaders; identity: { global_header?: unknown; global_footer?: unknown; global_prefooter?: unknown } | null }> {
  const [{ data: identity }, { data: pages }, { data: studios }] = await Promise.all([
    admin.from("site_identity").select("global_header, global_footer, global_prefooter").eq("tenant_id", tenantId).maybeSingle(),
    // Pages can carry their own header copy (translations, imports), which
    // may read a saved menu: counted for "where is this menu shown".
    admin.from("pages").select("blocks").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null).limit(400),
    // Own query: the studio columns may be missing (migrations 240/241), which only means "classic".
    admin.from("site_identity").select("header_studio, footer_studio").eq("tenant_id", tenantId).maybeSingle().then((r) => r, () => ({ data: null })),
  ]);
  const liveHeader = resolveLiveHeader((studios as { header_studio?: unknown } | null)?.header_studio);
  const liveFooter = resolveLiveFooter((studios as { footer_studio?: unknown } | null)?.footer_studio);
  const id = identity as { global_header?: unknown; global_footer?: unknown; global_prefooter?: unknown } | null;
  const readers = menuReaders({
    classicHeader: id?.global_header,
    classicFooter: id?.global_footer,
    classicPrefooter: id?.global_prefooter,
    pages: (pages ?? []).map((p) => (p as { blocks?: unknown }).blocks),
    studioHeaderRefs: liveHeader ? menuRefs(liveHeader) : null,
    studioFooterRefs: liveFooter ? footerMenuRefs(liveFooter) : null,
  });
  return { readers, identity: id };
}
