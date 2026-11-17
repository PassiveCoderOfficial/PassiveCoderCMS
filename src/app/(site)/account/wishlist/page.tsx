import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "../account-nav";
import { getCurrencyConfig, formatWithConfig } from "@/lib/ecommerce/currency-server";
import { WishlistRemoveButton } from "./wishlist-remove-button";

export const metadata = { title: "My Wishlist" };

type WishlistRow = {
  product_id: string;
  products: { id: string; name: string; slug: string; price: number; images: unknown } | null;
};

export default async function AccountWishlistPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  // RLS (wishlist_items_own_select, migration 084) restricts this to the
  // signed-in customer's own rows; tenant_id filter scopes to THIS store.
  const { data: rows } = await supabase
    .from("wishlist_items")
    .select("product_id, products(id, name, slug, price, images)")
    .eq("tenant_id", tenantId)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const items = (rows ?? []) as unknown as WishlistRow[];
  const currency = await getCurrencyConfig(tenantId);

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <AccountNav />

      {items.length === 0 ? (
        <div className="rounded-2xl bg-card border p-12 text-center text-sm text-muted-foreground">
          Nothing saved yet. Tap the heart on a product to save it here.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.filter((i) => i.products).map((item) => {
            const p = item.products!;
            const image = Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null;
            return (
              <div key={p.id} className="relative bg-card border rounded-xl overflow-hidden hover:border-primary transition-colors">
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="aspect-square bg-muted relative">
                    {image && <Image src={image} alt={p.name} fill className="object-cover" />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-base font-bold text-primary">{formatWithConfig(Number(p.price), currency)}</p>
                  </div>
                </Link>
                <WishlistRemoveButton productId={p.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
