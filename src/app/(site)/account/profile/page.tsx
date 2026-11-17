import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "../account-nav";
import { ChangePasswordForm, ProfileForm } from "./profile-form";

export const metadata = { title: "My Profile" };

export default async function AccountProfilePage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/profile");

  // RLS (customer_profiles_own_select, migration 084) restricts this to the
  // signed-in customer's own row.
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, phone")
    .eq("tenant_id", tenantId)
    .eq("customer_id", user.id)
    .maybeSingle();

  const mobileAccount = user.email?.endsWith("@mobile.passivecoder.com");
  const hasPassword = (user.identities ?? []).some((i) => i.provider === "email");
  const card = "rounded-2xl bg-card border p-5 sm:p-6";

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4">
      <AccountNav />
      <section className={card}>
        <h1 className="text-lg font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mb-5">
          {mobileAccount ? "Signed in with your mobile number." : <>Signed in as <b className="text-foreground">{user.email}</b></>}
        </p>
        <ProfileForm
          initial={{
            full_name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
            phone: profile?.phone ?? (user.user_metadata?.phone as string | undefined) ?? "",
          }}
        />
      </section>
      <Link href="/account/addresses" className={`${card} flex items-center gap-3 hover:border-primary transition-colors`}>
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <span className="flex-1">
          <b>Delivery addresses</b>
          <span className="block text-sm text-muted-foreground">Save home, office and more. Pick one at checkout.</span>
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>
      <section className={card}>
        <h2 className="text-lg font-bold">{hasPassword ? "Change password" : "Set a password"}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {hasPassword ? "Use at least 8 characters, with letters and numbers." : "You signed in with Google. Set a password to also sign in with your email."}
        </p>
        <ChangePasswordForm hasPassword={hasPassword} />
      </section>
    </div>
  );
}
