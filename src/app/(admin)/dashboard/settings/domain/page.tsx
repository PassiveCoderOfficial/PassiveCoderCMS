import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { isSaaS } from "@/lib/flags";
import DomainSettingsClient from "./domain-client";

export const metadata = { title: "Domain Settings" };

export default async function DomainSettingsPage() {
  if (!isSaaS) notFound();

  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id");
  if (!tenantId) notFound();

  const supabase = await createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id,slug,custom_domain,domain_status")
    .eq("id", tenantId)
    .single();

  return <DomainSettingsClient tenant={tenant} />;
}
