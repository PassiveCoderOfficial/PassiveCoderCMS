import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SA_VIEWING_COOKIE } from "@/lib/tenant/current";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "Missing tenant_id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = await createAdminClient();
  const { data: sa } = await adminClient.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Verify tenant exists
  const { data: tenant } = await adminClient.from("tenants").select("id").eq("id", tenantId).single();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Stay on root domain — SA manages tenant from their own session.
  // Cookie scoped to root domain so it's also readable on subdomains if needed.
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
  const cookieDomain = rootDomain ? `.${rootDomain.replace(/:\d+$/, "")}` : undefined;

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(SA_VIEWING_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
  return res;
}
