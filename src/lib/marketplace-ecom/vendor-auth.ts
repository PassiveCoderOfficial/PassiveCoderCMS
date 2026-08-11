import { createAdminClient, createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export interface VendorContext {
  vendor_id: string;
  tenant_id: string;
  name: string;
  slug: string | null;
  commission_rate: number;
  status: string;
  capabilities: string[];
}

/**
 * Resolve the ecommerce vendor account for the signed-in user.
 *
 * Returns null rather than throwing so routes can answer 401/403 in their own
 * shape. Only `approved` vendors resolve — a pending or suspended seller can
 * sign in but gets no data, which is what keeps a suspended shop from
 * continuing to work orders.
 */
export async function currentVendor(): Promise<VendorContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = await createAdminClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  let query = admin
    .from("vendors")
    .select("id, tenant_id, name, slug, commission_rate, status, capabilities")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .contains("capabilities", ["ecommerce"]);

  // On a store subdomain, scope to that store — one person may sell on more
  // than one marketplace built on this platform.
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data } = await query.limit(1).maybeSingle();
  if (!data) return null;

  return {
    vendor_id: data.id,
    tenant_id: data.tenant_id,
    name: data.name,
    slug: data.slug,
    commission_rate: Number(data.commission_rate ?? 0),
    status: data.status,
    capabilities: data.capabilities ?? [],
  };
}

export type VendorApplicationStatus = "none" | "pending" | "suspended" | "approved";

/**
 * Where the signed-in user stands as a seller, regardless of approval.
 *
 * `currentVendor` deliberately only resolves approved sellers, which leaves
 * callers unable to tell "never applied" apart from "waiting for review" —
 * they'd send a curious visitor and a real pending seller to the same
 * "account not active" dead end.
 */
export async function vendorApplicationStatus(): Promise<VendorApplicationStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "none";

  const admin = await createAdminClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  let query = admin
    .from("vendors")
    .select("status")
    .eq("user_id", user.id)
    .contains("capabilities", ["ecommerce"]);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data } = await query.limit(1).maybeSingle();
  if (!data) return "none";
  return (data.status as VendorApplicationStatus) ?? "none";
}
