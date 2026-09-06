import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "../account-nav";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "My Profile" };

export default async function AccountProfilePage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  // RLS (customer_profiles_own_select, migration 084) already restricts this
  // to the signed-in customer's own row.
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, phone, address_line1, address_line2, city, area, postal_code, country")
    .eq("tenant_id", tenantId)
    .eq("customer_id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <AccountNav />
      <h1 className="text-xl font-semibold mb-6">My Profile</h1>
      <ProfileForm
        initial={{
          full_name: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          address_line1: profile?.address_line1 ?? "",
          address_line2: profile?.address_line2 ?? "",
          city: profile?.city ?? "",
          area: profile?.area ?? "",
          postal_code: profile?.postal_code ?? "",
          country: profile?.country ?? "",
        }}
      />
    </div>
  );
}
