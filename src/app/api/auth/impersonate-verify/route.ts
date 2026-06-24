import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Called by the SA impersonation flow. The browser is redirected here on the
// TARGET subdomain so verifyOtp writes session cookies scoped to this domain.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokenHash = searchParams.get("token_hash");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url));
  }

  // Session cookie now set on this subdomain — redirect to dashboard
  return NextResponse.redirect(new URL(next, req.url));
}
