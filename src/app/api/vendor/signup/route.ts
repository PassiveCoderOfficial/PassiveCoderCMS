import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Seller application.
 *
 * Creates the auth user (or attaches to the signed-in one) plus a `pending`
 * vendor row. Applications always land as pending — approval, commission rate
 * and going live are the platform's call, never the applicant's, so none of
 * those fields are read from the request body.
 */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const shopName = body.shop_name?.trim();
  const ownerName = body.owner_name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!shopName) return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
  if (!ownerName) return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  if (!/^01[3-9]\d{8}$/.test(phone ?? "")) {
    return NextResponse.json({ error: "Enter a valid 11-digit mobile number" }, { status: 400 });
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Reuse the session if the applicant is already signed in; otherwise create
  // an account so they can track the application and sign in once approved.
  const authClient = await createClient();
  const {
    data: { user: signedInUser },
  } = await authClient.auth.getUser();

  let userId = signedInUser?.id ?? null;

  if (!userId) {
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Choose a password of at least 8 characters" },
        { status: 400 },
      );
    }
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: ownerName },
    });
    if (authErr) {
      // Most common cause by far is an existing account — say so plainly
      // rather than leaking the raw auth error.
      const msg = /already|exists|registered/i.test(authErr.message)
        ? "An account with this email already exists. Sign in first, then apply."
        : "Could not create your account";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    userId = created.user?.id ?? null;
  }

  if (!userId) return NextResponse.json({ error: "Could not create your account" }, { status: 400 });

  const { data: existing } = await admin
    .from("vendors")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .contains("capabilities", ["ecommerce"])
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "You already have a seller application for this marketplace", status: existing.status },
      { status: 409 },
    );
  }

  // Shop slugs drive /shop?vendor=<slug> and are unique per tenant.
  const base = slugify(shopName) || "shop";
  let slug = base;
  for (let i = 2; i < 60; i++) {
    const { data: clash } = await admin
      .from("vendors")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const { error: insertErr } = await admin.from("vendors").insert({
    tenant_id: tenantId,
    user_id: userId,
    name: shopName,
    slug,
    capabilities: ["ecommerce"],
    contact_name: ownerName,
    phone,
    email,
    description: body.description?.trim() || null,
    pickup_address: body.pickup_address?.trim() || null,
    pickup_area: body.pickup_area?.trim() || null,
    bkash_number: body.bkash_number?.trim() || null,
    trade_license: body.trade_license?.trim() || null,
    // Never trust the applicant for these.
    status: "pending",
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: "pending", created_account: !signedInUser });
}
