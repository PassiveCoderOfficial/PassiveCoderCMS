import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductForm } from "../product-form";
import type { Product } from "@/types/cms";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm product={product as Product} />
    </div>
  );
}
