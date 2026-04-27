import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import IdentityClient from "./identity-client";

export const metadata = { title: "Identity & Nav — Dashboard" };

export default async function IdentityPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const [{ data: identity }, { data: menus }] = await Promise.all([
    supabase.from("site_identity").select("*").eq("tenant_id", tid).single(),
    supabase.from("nav_menus").select("*").eq("tenant_id", tid),
  ]);

  return <IdentityClient initialIdentity={identity ?? null} initialMenus={menus ?? []} />;
}
