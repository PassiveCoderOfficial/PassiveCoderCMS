import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PricingManagerClient from "./pricing-manager-client";

export const metadata = { title: "Pricing — Dashboard" };

export default async function PricingManagerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
  if (!member?.tenant_id) redirect("/login?error=no_tenant");

  const { data: tables } = await supabase
    .from("pricing_tables")
    .select("*, pricing_packages(*)")
    .eq("tenant_id", member.tenant_id)
    .order("sort_order");

  return <PricingManagerClient initialTables={tables ?? []} />;
}
