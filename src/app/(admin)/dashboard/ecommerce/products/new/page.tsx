import { redirect } from "next/navigation";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { ProductForm } from "../product-form";
import { adminProductCreationOff } from "../marketplace-guard";

export default async function NewProductPage() {
  // Marketplace: sellers add products from the Seller Centre.
  if (await adminProductCreationOff(await getCurrentTenantId())) redirect("/dashboard/ecommerce/products?note=sellers_add");
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <ProductForm />
    </div>
  );
}
