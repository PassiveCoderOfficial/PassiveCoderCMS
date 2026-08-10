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

export type LinkTarget = {
  label: string;
  url: string;
  group: "Pages" | "Shop" | "Services" | "Special";
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getCurrentTenantId();
  if (!tenantId) return NextResponse.json({ error: "No site context" }, { status: 400 });

  const admin = await createAdminClient();

  const [pagesRes, categoriesRes, groupsRes] = await Promise.all([
    admin.from("pages").select("title, slug, type")
      .eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null)
      .order("order_index", { ascending: true }),
    admin.from("categories").select("name, slug").eq("tenant_id", tenantId),
    admin.from("service_groups").select("name, slug").eq("tenant_id", tenantId)
      .order("sort_order", { ascending: true }),
  ]);

  const targets: LinkTarget[] = [];

  targets.push({ label: "Home", url: "/", group: "Special" });

  for (const p of pagesRes.data ?? []) {
    const slug = p.slug as string;
    if (slug.toLowerCase() === "home") continue; // already offered as "/"
    targets.push({
      label: p.title as string,
      url: `/${slug}`,
      group: (p.type as string) === "post" ? "Pages" : "Pages",
    });
  }

  for (const g of groupsRes.data ?? []) {
    targets.push({
      label: `${g.name as string} (services section)`,
      url: `/services#${g.slug as string}`,
      group: "Services",
    });
  }

  if ((categoriesRes.data ?? []).length) {
    targets.push({ label: "Shop — all products", url: "/shop", group: "Shop" });
    for (const c of categoriesRes.data ?? []) {
      targets.push({
        label: c.name as string,
        url: `/shop?category=${c.slug as string}`,
        group: "Shop",
      });
    }
  }

  targets.push({ label: "Cart", url: "/cart", group: "Shop" });

  return NextResponse.json({ targets });
}
