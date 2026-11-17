import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { LoginForm } from "./login-form";
import { createAdminClient } from "@/lib/supabase/server";
import { brandForHost, brandForTenant } from "@/lib/partners/brand";
import { tenantChrome } from "@/lib/site/tenant-chrome";

import { PLATFORM_LOGO_URL } from "@/lib/platform-contact";
const LOGO = process.env.NEXT_PUBLIC_LOGO_URL ?? PLATFORM_LOGO_URL;

export default async function LoginPage() {
  // White-label: a partner's dashboard domain, or a site resold by a
  // white-label partner, signs in under the partner's brand.
  const h = await headers();
  const admin = await createAdminClient();
  const brand = h.get("x-brand-partner")
    ? await brandForHost(admin, h.get("host") ?? "")
    : await brandForTenant(admin, h.get("x-tenant-id"));
  // No reseller brand: on a client's own host, sign in under the client's
  // own logo/name rather than Passive Coder's.
  const site = brand ? null : await tenantChrome();
  const logo = brand?.logoUrl ?? site?.logoUrl ?? (site ? null : LOGO || null);
  const logoName = brand?.name ?? site?.name ?? "Passive Coder";
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            {!logo ? (
              <span className="text-2xl font-bold">{logoName}</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={logoName} className="h-12 w-auto mx-auto" />
            )}
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        {!brand && !site && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">Sign up free</Link>
          </p>
        )}
      </div>
    </div>
  );
}
