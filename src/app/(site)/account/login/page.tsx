import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerLoginForm } from "./login-form";

export const metadata = { title: "Sign In" };

export default async function AccountLoginPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  // Already signed in — nothing to do here.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/account/orders");

  return <CustomerLoginForm />;
}
