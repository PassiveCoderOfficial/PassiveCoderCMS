import { getCurrentTenantId } from "@/lib/tenant/current";
import TemplatesClient from "./templates-client";

export default async function TemplatesPage() {
  const tenantId = await getCurrentTenantId();
  return <TemplatesClient tenantId={tenantId} />;
}
