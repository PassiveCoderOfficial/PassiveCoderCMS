"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Package, Loader2, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  status: "active" | "draft" | "archived";
  stock_quantity: number;
  images: string[];
  featured: boolean;
  created_at: string;
}

const STATUS_VARIANT: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  archived: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const supabase = createClient();

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"" | "active" | "draft" | "archived">("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    getClientTenantId().then((tenantId) => {
      let q = supabase.from("products")
        .select("id,name,slug,price,compare_price,status,stock_quantity,images,featured,created_at")
        .order("created_at", { ascending: false });
      if (tenantId) q = q.eq("tenant_id", tenantId);
      q.then(({ data }) => { setProducts((data as Product[]) ?? []); setLoading(false); });
    });
  }, []);

  async function toggleStatus(p: Product) {
    const next = p.status === "active" ? "draft" : "active";
    await supabase.from("products").update({ status: next }).eq("id", p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x));
    toast.success(`${p.name} is now ${next}`);
  }

  async function toggleFeatured(p: Product) {
    await supabase.from("products").update({ featured: !p.featured }).eq("id", p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, featured: !x.featured } : x));
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeleting(p.id);
    await supabase.from("products").delete().eq("id", p.id);
    setProducts(prev => prev.filter(x => x.id !== p.id));
    setDeleting(null);
    toast.success("Product deleted");
  }

  const filtered = filter ? products.filter(p => p.status === filter) : products;
  const counts = {
    all: products.length,
    active: products.filter(p => p.status === "active").length,
    draft: products.filter(p => p.status === "draft").length,
    archived: products.filter(p => p.status === "archived").length,
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6" /> Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} total products</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ecommerce/products/new"><Plus className="h-4 w-4 mr-2" /> Add Product</Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([["", "All"], ["active", "Active"], ["draft", "Draft"], ["archived", "Archived"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              filter === val ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
            {label} <span className="ml-1 opacity-60">{val === "" ? counts.all : counts[val as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <h3 className="font-semibold mb-2">{filter ? `No ${filter} products` : "No products yet"}</h3>
          {!filter && <Button asChild><Link href="/dashboard/ecommerce/products/new"><Plus className="h-4 w-4 mr-2" /> Add First Product</Link></Button>}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(product => {
                const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
                return (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden shrink-0 border">
                          {firstImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={firstImage} alt={product.name} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                          )}
                        </div>
                        <div>
                          <Link href={`/dashboard/ecommerce/products/${product.id}`} className="font-medium hover:text-primary transition-colors">
                            {product.name}
                          </Link>
                          {product.featured && (
                            <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Featured</span>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5 md:hidden">{formatCurrency(product.price)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-medium">{formatCurrency(product.price)}</span>
                      {product.compare_price && (
                        <span className="text-xs text-muted-foreground line-through ml-1.5">{formatCurrency(product.compare_price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn("text-sm font-medium", product.stock_quantity === 0 ? "text-red-600" : product.stock_quantity <= 5 ? "text-amber-600" : "")}>
                        {product.stock_quantity}
                      </span>
                      {product.stock_quantity === 0 && <span className="text-xs text-red-500 ml-1">Out of stock</span>}
                      {product.stock_quantity > 0 && product.stock_quantity <= 5 && <span className="text-xs text-amber-500 ml-1">Low</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full capitalize", STATUS_VARIANT[product.status])}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleFeatured(product)} title={product.featured ? "Remove featured" : "Mark as featured"}
                          className={cn("p-1.5 rounded-lg transition-colors", product.featured ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-muted-foreground hover:text-amber-500 hover:bg-muted")}>
                          <Star className="h-3.5 w-3.5" fill={product.featured ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => toggleStatus(product)} title={product.status === "active" ? "Set to draft" : "Set to active"}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          {product.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <Link href={`/dashboard/ecommerce/products/${product.id}`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => remove(product)} disabled={deleting === product.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                          {deleting === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
