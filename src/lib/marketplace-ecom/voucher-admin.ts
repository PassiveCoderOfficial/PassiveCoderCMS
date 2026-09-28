import { createAdminClient } from "@/lib/supabase/server";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

/** Validate a voucher create/update payload. Shared by the store-admin
 *  (platform vouchers) and Seller Centre (shop vouchers) routes so the rules
 *  can't drift between them. */
export function cleanVoucherInput(b: Record<string, unknown>, isSeller: boolean) {
  const code = String(b.code ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const kind = String(b.kind ?? "");
  const value = Number(b.value ?? 0);
  if (code.length < 3 || code.length > 24) return { error: "Code must be 3–24 letters/numbers" };
  if (!["percent", "fixed", "free_shipping"].includes(kind)) return { error: "Pick a voucher type" };
  if (isSeller && kind === "free_shipping") return { error: "Free delivery vouchers are platform-only" };
  if (kind === "percent" && (value <= 0 || value > 90)) return { error: "Percent must be 1–90" };
  if (kind === "fixed" && value <= 0) return { error: "Enter a discount amount" };
  const num = (v: unknown) => (v === "" || v == null ? null : Math.max(0, Number(v)));
  return {
    row: {
      code,
      title: String(b.title ?? "").trim().slice(0, 80) || code,
      kind,
      value: kind === "free_shipping" ? 0 : value,
      max_discount: num(b.max_discount),
      min_spend: num(b.min_spend) ?? 0,
      starts_at: b.starts_at ? new Date(String(b.starts_at)).toISOString() : new Date().toISOString(),
      ends_at: b.ends_at ? new Date(String(b.ends_at)).toISOString() : null,
      usage_limit: num(b.usage_limit),
      per_user_limit: Math.max(1, Number(b.per_user_limit ?? 1) || 1),
      is_public: b.is_public !== false,
      status: b.status === "paused" ? "paused" : "active",
    },
  };
}

export async function listVouchers(admin: Admin, tenantId: string, vendorId: string | null) {
  let q = admin
    .from("vouchers")
    .select("id, code, title, kind, value, max_discount, min_spend, starts_at, ends_at, usage_limit, per_user_limit, used_count, is_public, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  q = vendorId ? q.eq("vendor_id", vendorId) : q.is("vendor_id", null);
  const { data } = await q;
  return data ?? [];
}
