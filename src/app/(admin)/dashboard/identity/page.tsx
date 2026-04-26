import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import IdentityClient from "./identity-client";

export const metadata = { title: "Identity & Nav — Dashboard" };

export default async function IdentityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
  if (!member?.tenant_id) redirect("/login?error=no_tenant");

  const tid = member.tenant_id;
  const [{ data: identity }, { data: menus }] = await Promise.all([
    supabase.from("site_identity").select("*").eq("tenant_id", tid).single(),
    supabase.from("nav_menus").select("*").eq("tenant_id", tid),
  ]);

  return <IdentityClient initialIdentity={identity ?? null} initialMenus={menus ?? []} />;
}
