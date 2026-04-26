import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Image from "next/image";
import { ProductActions } from "./product-actions";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, compare_price, status, stock_quantity, images, created_at")
    .order("created_at", { ascending: false });

  const statusVariant: Record<string, "success" | "outline" | "secondary"> = {
    active: "success", draft: "outline", archived: "secondary",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{products?.length ?? 0} products total</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ecommerce/products/new"><Plus className="h-4 w-4 mr-2" /> Add Product</Link>
        </Button>
      </div>

      {!products?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No products yet</h3>
          <Button asChild><Link href="/dashboard/ecommerce/products/new"><Plus className="h-4 w-4 mr-2" /> Add First Product</Link></Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Price</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Stock</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const images = Array.isArray(product.images) ? product.images : [];
                  const firstImage = images[0] as string | undefined;
                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                            {firstImage ? (
                              <Image src={firstImage} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                            )}
                          </div>
                          <Link href={`/admin/ecommerce/products/${product.id}`} className="font-medium text-sm hover:text-primary">
                            {product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        <div>
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                          {product.compare_price && (
                            <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(product.compare_price)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">
                        <span className={product.stock_quantity <= 5 ? "text-red-600 font-medium" : ""}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={statusVariant[product.status] ?? "outline"} className="capitalize text-xs">
                          {product.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ProductActions productId={product.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
