/**
 * Everything a menu item can point at, for the link picker in the nav manager.
 *
 * Typing URLs by hand is how menus end up pointing at pages that don't exist —
 * the "#services" problem the templates shipped with. Offering the real
 * destinations makes a broken link the exception rather than the default.
 */
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { getApiCaller } from "@/lib/auth/api-caller";
import type { NavLinkKind } from "@/types/cms";
import { refUrlFor } from "@/modules/navigation/menu-refs";

/**
 * `kind` + `ref` (menus P1): picking this target links the menu item by id,
 * so the live menu follows a later rename. `url` is the address today.
 */
export type LinkTarget = {
  label: string;
  url: string;
  group: "Pages" | "Posts" | "Shop" | "Products" | "Services" | "Special";
  kind?: NavLinkKind;
  ref?: string;
};

export async function GET() {
  // Mobile app: Bearer + X-Tenant-Id (membership verified). Web: cookie session.
  const caller = await getApiCaller();
  let tenantId: string | null;
  if (caller?.via === "bearer") {
    tenantId = caller.tenantId;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    tenantId = await getCurrentTenantId();
  }
  if (!tenantId) return NextResponse.json({ error: "No site context" }, { status: 400 });

  const admin = await createAdminClient();

  const [pagesRes, categoriesRes, groupsRes, productsRes, servicesRes] = await Promise.all([
    admin.from("pages").select("id, title, slug, type")
      .eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null)
      .order("order_index", { ascending: true }),
    admin.from("categories").select("id, name, slug").eq("tenant_id", tenantId),
    admin.from("service_groups").select("id, name, slug").eq("tenant_id", tenantId)
      .order("sort_order", { ascending: true }),
    admin.from("products").select("id, name, slug").eq("tenant_id", tenantId).eq("status", "active")
      .order("created_at", { ascending: false }).limit(200),
    admin.from("service_items").select("id, title, link").eq("tenant_id", tenantId)
      .order("sort_order", { ascending: true }).limit(200),
  ]);

  const targets: LinkTarget[] = [];
  const pages = (pagesRes.data ?? []) as { id: string; title: string; slug: string; type: string | null }[];

  // Home links by id too when the site has a "home" page, so "/" stays "/".
  const home = pages.find((p) => p.slug.toLowerCase() === "home");
  targets.push({ label: "Home", url: "/", group: "Special", ...(home ? { kind: "page" as const, ref: home.id } : {}) });

  for (const p of pages) {
    if (p.slug.toLowerCase() === "home") continue; // already offered as "/"
    const kind = p.type === "post" ? "post" : "page";
    targets.push({ label: p.title, url: refUrlFor(kind, p) ?? `/${p.slug}`, group: kind === "post" ? "Posts" : "Pages", kind, ref: p.id });
  }

  for (const g of (groupsRes.data ?? []) as { id: string; name: string; slug: string }[]) {
    targets.push({
      label: `${g.name} (services section)`,
      url: `/services#${g.slug}`,
      group: "Services",
      kind: "service_group",
      ref: g.id,
    });
  }
  for (const sv of (servicesRes.data ?? []) as { id: string; title: string; link: string | null }[]) {
    targets.push({ label: sv.title, url: refUrlFor("service", sv)!, group: "Services", kind: "service", ref: sv.id });
  }

  if ((categoriesRes.data ?? []).length) {
    targets.push({ label: "Shop — all products", url: "/shop", group: "Shop" });
    for (const c of (categoriesRes.data ?? []) as { id: string; name: string; slug: string }[]) {
      targets.push({
        label: c.name,
        url: `/shop?category=${c.slug}`,
        group: "Shop",
        kind: "category",
        ref: c.id,
      });
    }
  }
  for (const pr of (productsRes.data ?? []) as { id: string; name: string; slug: string | null }[]) {
    targets.push({ label: pr.name, url: refUrlFor("product", pr)!, group: "Products", kind: "product", ref: pr.id });
  }

  targets.push({ label: "Cart", url: "/cart", group: "Shop" });

  return NextResponse.json({ targets });
}
