import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "../account-nav";
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

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <AccountNav />
      <h1 className="text-xl font-semibold mb-6">My Wishlist</h1>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing saved yet. Tap the heart on a product to save it here.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.filter((i) => i.products).map((item) => {
            const p = item.products!;
            const image = Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null;
            return (
              <div key={p.id} className="relative border rounded-lg overflow-hidden">
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="aspect-square bg-muted relative">
                    {image && <Image src={image} alt={p.name} fill className="object-cover" />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">${Number(p.price).toFixed(2)}</p>
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
