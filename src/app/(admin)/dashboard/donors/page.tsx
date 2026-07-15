import { getCurrentTenantId } from "@/lib/tenant/current";
import { createAdminClient } from "@/lib/supabase/server";
import DonorsDashboardClient from "./donors-client";
import { redirect } from "next/navigation";

export const metadata = { title: "Donors — Dashboard" };

export default async function DashboardDonorsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createAdminClient();
  // Only surface this page for tenants that actually have the donor module
  // (a donors table row for this tenant, or the blood tenant).
  const { data: tenant } = await supabase.from("tenants").select("slug").eq("id", tid).maybeSingle();
  if (tenant?.slug !== "blood") redirect("/dashboard");

  return <DonorsDashboardClient />;
}
