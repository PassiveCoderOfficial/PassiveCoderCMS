"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Customer-facing auth actions — deliberately separate from
 * (auth)/login/actions.ts, which is staff/admin login into the CMS
 * dashboard. Same Supabase auth.users table underneath (shared infra), but a
 * different audience and a different redirect: a customer signing in here
 * lands back on the tenant's own storefront, never the dashboard or
 * super-admin panel. Nothing here grants dashboard/staff access — that's
 * gated separately by tenant_members / super_admins membership rows, which a
 * plain customer signup never creates.
 */
export async function customerLoginAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function customerSignupAction(email: string, password: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function customerLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export interface CustomerProfileFields {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  area: string;
  postal_code: string;
  country: string;
}

/** Saves the signed-in customer's profile/default address for THIS tenant.
 *  RLS (customer_profiles_own_upsert/own_update, migration 084) already
 *  restricts this to rows where customer_id = auth.uid() — the tenant_id
 *  scoping here is what a customer of more than one tenant's storefront
 *  needs, since each tenant gets its own saved address/profile row. */
export async function saveCustomerProfileAction(fields: CustomerProfileFields) {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return { error: "Unknown store" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("customer_profiles")
    .upsert(
      { tenant_id: tenantId, customer_id: user.id, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id,customer_id" },
    );
  if (error) return { error: error.message };
  return { error: null };
}

/** Toggles a product on the signed-in customer's wishlist for THIS tenant. */
export async function toggleWishlistAction(productId: string, save: boolean) {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return { error: "Unknown store" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (save) {
    // Unique (tenant_id, customer_id, product_id) makes re-saving a no-op
    // rather than a duplicate-row error — ignoreDuplicates keeps this a
    // clean toggle regardless of whether it was already saved.
    const { error } = await supabase
      .from("wishlist_items")
      .upsert(
        { tenant_id: tenantId, customer_id: user.id, product_id: productId },
        { onConflict: "tenant_id,customer_id,product_id", ignoreDuplicates: true },
      );
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("customer_id", user.id)
      .eq("product_id", productId);
    if (error) return { error: error.message };
  }
  return { error: null };
}
