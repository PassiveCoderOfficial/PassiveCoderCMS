import { redirect } from "next/navigation";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { adminProductCreationOff } from "../marketplace-guard";

/** The bulk upload page is a client component, so the marketplace block lives here. */
export default async function BulkUploadLayout({ children }: { children: React.ReactNode }) {
  if (await adminProductCreationOff(await getCurrentTenantId())) redirect("/dashboard/ecommerce/products?note=sellers_add");
  return <>{children}</>;
}
