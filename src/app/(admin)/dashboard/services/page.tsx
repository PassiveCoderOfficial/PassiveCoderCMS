import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServicesClient from "./services-client";

export const metadata = { title: "Services — Dashboard" };

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!member?.tenant_id) redirect("/login?error=no_tenant");

  const { data: groups } = await supabase
    .from("service_groups")
    .select("*, service_items(*)")
    .eq("tenant_id", member.tenant_id)
    .order("sort_order");

  return <ServicesClient initialGroups={groups ?? []} />;
}
