"use server";

import { headers } from "next/headers";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  checkAddress, checkEmailOrPhone, checkName, checkPassword, checkPhone, friendlyAuthError, looksLikePhone, normalizePhone,
} from "@/lib/validation/customer";

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
/** Mobile-number accounts sign in with a stand-in email built from the
 *  number; the real number lives in user_metadata and customer_profiles. */
const phoneEmail = (phone: string) => `p${normalizePhone(phone).replace(/\D/g, "")}@mobile.passivecoder.com`;

/** Emails to try for a sign-in identifier: an email as typed, or for a
 *  mobile number the account whose store profile has that number (so an
 *  email account that saved its number can sign in with either), then the
 *  stand-in email of a mobile-number account. */
async function emailsFor(identifier: string, tenantId: string | null): Promise<string[]> {
  const id = identifier.trim();
  if (!looksLikePhone(id)) return [id.toLowerCase()];
  const n = normalizePhone(id);
  const out: string[] = [];
  if (tenantId) {
    const admin = await createAdminClient();
    const { data } = await admin.from("customer_profiles").select("customer_id").eq("tenant_id", tenantId).in("phone", [n, `+88${n}`, `88${n}`]).limit(3);
    // Sellers sign in on the same form (/vendor/login) with their shop's number.
    const { data: shops } = await admin.from("vendors").select("user_id").eq("tenant_id", tenantId).not("user_id", "is", null).in("phone", [n, `+88${n}`, `88${n}`]).limit(3);
    for (const id of [...(data ?? []).map((r) => r.customer_id), ...(shops ?? []).map((r) => r.user_id)]) {
      const { data: u } = await admin.auth.admin.getUserById(id);
      if (u.user?.email) out.push(u.user.email);
    }
  }
  out.push(phoneEmail(n));
  return [...new Set(out)];
}

export async function customerLoginAction(identifier: string, password: string) {
  const bad = checkEmailOrPhone(identifier) ?? (password ? null : "Please enter your password");
  if (bad) return { error: bad };
  const tenantId = (await headers()).get("x-tenant-id");
  const supabase = await createClient();
  let last = "Invalid login credentials";
  for (const email of await emailsFor(identifier, tenantId)) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };
    last = error.message;
  }
  return { error: friendlyAuthError(last) };
}

/** Sign up with an email or a mobile number. Email confirmation is off for
 *  the project, so the new customer is signed in straight away. */
export async function customerSignupAction(identifier: string, password: string, name: string) {
  const bad = checkName(name) ?? checkEmailOrPhone(identifier) ?? checkPassword(password);
  if (bad) return { error: bad, signedIn: false };
  const tenantId = (await headers()).get("x-tenant-id");
  const supabase = await createClient();
  const id = identifier.trim();
  const phone = looksLikePhone(id) ? normalizePhone(id) : null;
  const taken = "An account with this mobile number already exists. Sign in instead.";

  if (phone) {
    const admin = await createAdminClient();
    if (tenantId) {
      const { count } = await admin.from("customer_profiles").select("customer_id", { count: "exact", head: true })
        .eq("tenant_id", tenantId).in("phone", [phone, `+88${phone}`, `88${phone}`]);
      if (count) return { error: taken, signedIn: false };
    }
    const { error } = await admin.auth.admin.createUser({
      email: phoneEmail(phone), password, email_confirm: true,
      user_metadata: { full_name: name.trim(), phone },
    });
    if (error) return { error: error.message.toLowerCase().includes("already") ? taken : friendlyAuthError(error.message), signedIn: false };
    const { error: e2 } = await supabase.auth.signInWithPassword({ email: phoneEmail(phone), password });
    if (e2) return { error: friendlyAuthError(e2.message), signedIn: false };
  } else {
    const { data, error } = await supabase.auth.signUp({ email: id.toLowerCase(), password, options: { data: { full_name: name.trim() } } });
    if (error) return { error: friendlyAuthError(error.message), signedIn: false };
    // An existing confirmed email comes back with no identities instead of an error.
    if (data.user && !data.user.identities?.length) return { error: friendlyAuthError("already registered"), signedIn: false };
    if (!data.session) return { error: null, signedIn: false };
  }

  if (tenantId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("customer_profiles").upsert(
        { tenant_id: tenantId, customer_id: user.id, full_name: name.trim(), ...(phone ? { phone } : {}), updated_at: new Date().toISOString() },
        { onConflict: "tenant_id,customer_id" },
      );
    }
  }
  return { error: null, signedIn: true };
}

/** Email a password-reset link. Answers the same whether or not the account
 *  exists, so the form can't be used to find out who shops here. */
export async function customerForgotPasswordAction(identifier: string, next?: string) {
  const bad = checkEmailOrPhone(identifier);
  if (bad) return { error: bad };
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host") ?? ""}`;
  const admin = await createAdminClient();

  const emails = (await emailsFor(identifier, tenantId)).filter((e) => !e.endsWith("@mobile.passivecoder.com"));
  if (looksLikePhone(identifier) && !emails.length) {
    return { error: "This mobile number has no email on its account, so we can't send a reset link. Please contact the store and we'll help you get back in." };
  }
  const { data: site } = tenantId
    ? await admin.from("site_identity").select("site_name").eq("tenant_id", tenantId).maybeSingle()
    : { data: null };
  const store = String(site?.site_name ?? "our store").replace(/[<>"\r\n]/g, "").slice(0, 60);

  for (const email of emails) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
    if (error || !data.properties?.hashed_token) continue;
    const safeNext = safeRedirectPath(next, "");
    const back = safeNext ? `&next=${encodeURIComponent(safeNext)}` : "";
    const link = `${origin}/account/reset-password?token=${encodeURIComponent(data.properties.hashed_token)}${back}`;
    await sendEmail({
      to: email,
      from: `${store} <contact@noreply.passivecoder.com>`,
      subject: `Reset your ${store} password`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1A1330">
<h2 style="margin:0 0 12px">Reset your password</h2>
<p>We got a request to reset the password for your ${store} account.</p>
<p style="margin:24px 0"><a href="${link}" style="background:#FF5A1F;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold">Choose a new password</a></p>
<p style="color:#667085;font-size:13px">The link works once and expires in 1 hour. If you did not ask for this, ignore this email and your password stays the same.</p>
</div>`,
      text: `Reset your ${store} password: ${link}\n\nThe link works once and expires in 1 hour. If you did not ask for this, ignore this email.`,
    });
  }
  return { error: null };
}

/** Finish a reset: the emailed token signs the customer in, then the new
 *  password is saved. */
export async function customerResetPasswordAction(token: string, password: string) {
  const bad = checkPassword(password);
  if (bad) return { error: bad };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: token });
  if (error) return { error: "This reset link has expired or was already used. Please ask for a new one." };
  const { error: e2 } = await supabase.auth.updateUser({ password });
  if (e2) return { error: friendlyAuthError(e2.message) };
  return { error: null };
}

/** Signed-in customer changes their password. Accounts that only ever used
 *  Google have no current password and may set one directly. */
export async function customerChangePasswordAction(current: string, next: string) {
  const bad = checkPassword(next);
  if (bad) return { error: bad };
  if (current && current === next) return { error: "Your new password must be different from the old one." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };
  if ((user.identities ?? []).some((i) => i.provider === "email")) {
    if (!current) return { error: "Enter your current password" };
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (error) return { error: "Your current password isn't right." };
  }
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: friendlyAuthError(error.message) };
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
export async function saveCustomerProfileAction(fields: Partial<CustomerProfileFields>) {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return { error: "Unknown store" };
  const bad = (fields.full_name !== undefined ? checkName(fields.full_name) : null) ?? (fields.phone ? checkPhone(fields.phone) : null);
  if (bad) return { error: bad };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const row = { ...fields, ...(fields.phone ? { phone: normalizePhone(fields.phone) } : {}) };
  const { error } = await supabase
    .from("customer_profiles")
    .upsert(
      { tenant_id: tenantId, customer_id: user.id, ...row, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id,customer_id" },
    );
  if (error) return { error: "Couldn't save your profile. Please try again." };
  return { error: null };
}

export interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  area: string | null;
  city: string | null;
  /** BD_LOCATIONS district + thana (marketplace delivery pricing). */
  district?: string | null;
  thana?: string | null;
  postal_code: string | null;
  is_default: boolean;
}

/** The signed-in customer's saved addresses for this store, default first. */
export async function listAddressesAction(): Promise<SavedAddress[]> {
  const tenantId = (await headers()).get("x-tenant-id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!tenantId || !user) return [];
  const { data } = await supabase.from("customer_addresses")
    .select("id, label, full_name, phone, address_line1, area, city, district, thana, postal_code, is_default")
    .eq("tenant_id", tenantId).eq("customer_id", user.id)
    .order("is_default", { ascending: false }).order("created_at");
  return (data ?? []) as SavedAddress[];
}

/** Add or update a saved address. The first one, or one marked default,
 *  becomes the default (only one per customer per store). */
export async function saveAddressAction(a: Omit<SavedAddress, "id"> & { id?: string }) {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return { error: "Unknown store", id: null };
  const bad = checkName(a.full_name) ?? checkPhone(a.phone) ?? checkAddress(a.address_line1)
    ?? (a.label.trim().length > 30 ? "Label is too long (30 characters max)" : null);
  if (bad) return { error: bad, id: null };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again.", id: null };

  const { count } = await supabase.from("customer_addresses").select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId).eq("customer_id", user.id);
  if (!a.id && (count ?? 0) >= 10) return { error: "You can save up to 10 addresses. Remove one to add another.", id: null };
  const makeDefault = a.is_default || (count ?? 0) === 0;
  if (makeDefault) {
    await supabase.from("customer_addresses").update({ is_default: false }).eq("tenant_id", tenantId).eq("customer_id", user.id).neq("id", a.id ?? "00000000-0000-0000-0000-000000000000");
  }
  const row = {
    tenant_id: tenantId, customer_id: user.id,
    label: a.label.trim() || "Home", full_name: a.full_name.trim(), phone: normalizePhone(a.phone),
    address_line1: a.address_line1.trim(), area: a.area?.trim() || null, city: a.city?.trim() || null,
    ...(a.district !== undefined ? { district: a.district?.trim() || null, thana: a.thana?.trim() || null } : {}),
    postal_code: a.postal_code?.trim() || null, is_default: makeDefault, updated_at: new Date().toISOString(),
  };
  const res = a.id
    ? await supabase.from("customer_addresses").update(row).eq("id", a.id).eq("customer_id", user.id).select("id").single()
    : await supabase.from("customer_addresses").insert(row).select("id").single();
  if (res.error) return { error: "Couldn't save this address. Please try again.", id: null };
  return { error: null, id: res.data.id as string };
}

export async function deleteAddressAction(id: string) {
  const tenantId = (await headers()).get("x-tenant-id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!tenantId || !user) return { error: "Please sign in again." };
  const { data: gone } = await supabase.from("customer_addresses").delete().eq("id", id).eq("customer_id", user.id).select("is_default").maybeSingle();
  // Removing the default hands it to the oldest remaining address.
  if (gone?.is_default) {
    const { data: next } = await supabase.from("customer_addresses").select("id").eq("tenant_id", tenantId).eq("customer_id", user.id).order("created_at").limit(1).maybeSingle();
    if (next) await supabase.from("customer_addresses").update({ is_default: true }).eq("id", next.id);
  }
  return { error: null };
}

export async function setDefaultAddressAction(id: string) {
  const tenantId = (await headers()).get("x-tenant-id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!tenantId || !user) return { error: "Please sign in again." };
  await supabase.from("customer_addresses").update({ is_default: false }).eq("tenant_id", tenantId).eq("customer_id", user.id);
  await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id).eq("customer_id", user.id);
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
