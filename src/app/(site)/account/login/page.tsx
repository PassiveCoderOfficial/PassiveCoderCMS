import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerLoginForm } from "./login-form";

export const metadata = { title: "Sign In" };

/** Only same-site relative paths, so ?next= can't bounce users off-site. */
function safeNext(v: string | undefined) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/account/orders";
}

export default async function AccountLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  // Already signed in — nothing to do here.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(next);

  return <CustomerLoginForm next={next} />;
}
