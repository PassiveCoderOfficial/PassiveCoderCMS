import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * /shop/<slug> is a legacy address: products live at /products/<slug>.
 * Category tiles and imported menus also link categories as /shop/<slug>,
 * so a slug that is one of this site's product categories goes to the
 * shop filtered by it instead of a product page that doesn't exist.
 */
export default async function ShopSlugRedirect({ params }: Props) {
  const { slug } = await params;
  const tenantId = (await headers()).get("x-tenant-id");
  if (tenantId) {
    const admin = await createAdminClient();
    const { data: cat } = await admin.from("categories").select("slug").eq("tenant_id", tenantId)
      .eq("type", "product").eq("slug", slug).maybeSingle();
    if (cat) redirect(`/shop?category=${encodeURIComponent(slug)}`);
  }
  redirect(`/products/${slug}`);
}
