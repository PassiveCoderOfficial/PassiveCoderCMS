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
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <AccountNav />
      <div className="rounded-2xl bg-card border p-5 sm:p-6">
        <h1 className="text-lg font-bold mb-4">Profile & delivery address</h1>
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
    </div>
  );
}
