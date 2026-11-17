import { getCurrentTenantId } from "@/lib/tenant/current";
import { NewPageForm } from "./new-page-form";

export default async function NewPagePage() {
  const tenantId = await getCurrentTenantId();
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Page</h1>
      <NewPageForm tenantId={tenantId} />
    </div>
  );
}
