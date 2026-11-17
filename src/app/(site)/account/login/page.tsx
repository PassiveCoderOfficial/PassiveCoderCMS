import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerLoginForm } from "./login-form";
import { enabledSocialProviders } from "@/lib/auth/providers";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

export const metadata = { title: "Sign In" };

/** Only same-site relative paths, so ?next= can't bounce users off-site. */
function safeNext(v: string | undefined) {
  return safeRedirectPath(v, "/account/orders");
}

export default async function AccountLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string; mode?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  // Already signed in — nothing to do here.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(next);

  const social = await enabledSocialProviders();
  return <CustomerLoginForm next={next} reason={sp.reason} initialMode={sp.mode === "signup" ? "signup" : "login"} google={social.google} facebook={social.facebook} />;
}
