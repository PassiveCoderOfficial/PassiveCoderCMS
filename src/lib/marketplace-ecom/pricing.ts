import { createAdminClient } from "@/lib/supabase/server";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface FlashPrice {
  item_id: string;
  flash_sale_id: string;
  sale_price: number;
  quantity_limit: number | null;
  sold: number;
  ends_at: string;
}

/** Live flash-sale price per product (the lowest if a product is somehow in
 *  two overlapping campaigns). Only campaigns running right now count. */
export async function activeFlashPrices(
  admin: Admin, tenantId: string, productIds: string[],
): Promise<Map<string, FlashPrice>> {
  const out = new Map<string, FlashPrice>();
  if (!productIds.length) return out;
  const now = new Date().toISOString();
  const { data } = await admin
    .from("flash_sale_items")
    .select("id, product_id, sale_price, quantity_limit, sold, flash_sale_id, flash_sales!inner(status, starts_at, ends_at)")
    .eq("tenant_id", tenantId)
    .in("product_id", productIds)
    .eq("flash_sales.status", "active")
    .lte("flash_sales.starts_at", now)
    .gt("flash_sales.ends_at", now);
  for (const r of data ?? []) {
    const fs = r.flash_sales as unknown as { ends_at: string };
    const remaining = r.quantity_limit == null ? Infinity : r.quantity_limit - r.sold;
    if (remaining <= 0) continue;
    const cur = out.get(r.product_id);
    if (!cur || Number(r.sale_price) < cur.sale_price) {
      out.set(r.product_id, {
        item_id: r.id,
        flash_sale_id: r.flash_sale_id,
        sale_price: Number(r.sale_price),
        quantity_limit: r.quantity_limit,
        sold: r.sold,
        ends_at: fs.ends_at,
      });
    }
  }
  return out;
}

export interface VoucherRow {
  id: string;
  vendor_id: string | null;
  code: string;
  title: string;
  kind: "percent" | "fixed" | "free_shipping";
  value: number;
  max_discount: number | null;
  min_spend: number;
  starts_at: string;
  ends_at: string | null;
  usage_limit: number | null;
  per_user_limit: number;
  used_count: number;
  status: string;
}

export interface AppliedVoucher {
  voucher_id: string;
  code: string;
  title: string;
  vendor_id: string | null;
  amount: number;
}

interface GroupLike {
  vendor_id: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  platform_discount: number;
}

/**
 * Validate and apply voucher codes to vendor groups in place.
 *
 * At most one platform voucher and one voucher per seller. Seller vouchers
 * go to `discount` on that seller's group (seller-funded); platform vouchers
 * are spread across groups as `platform_discount` (platform-funded) in
 * proportion to each group's goods value — free-shipping vouchers cover each
 * group's own delivery charge.
 */
export async function applyVouchers(
  admin: Admin,
  tenantId: string,
  codes: string[],
  groups: GroupLike[],
  who: { customerId?: string | null; phone?: string | null },
): Promise<{ applied: AppliedVoucher[]; errors: string[] }> {
  const applied: AppliedVoucher[] = [];
  const errors: string[] = [];
  const wanted = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].slice(0, 5);
  if (!wanted.length) return { applied, errors };

  const { data } = await admin
    .from("vouchers")
    .select("id, vendor_id, code, title, kind, value, max_discount, min_spend, starts_at, ends_at, usage_limit, per_user_limit, used_count, status")
    .eq("tenant_id", tenantId);
  const byCode = new Map(((data ?? []) as VoucherRow[]).map((v) => [v.code.toUpperCase(), v]));

  // Shop vouchers first: a platform voucher's min spend and share are
  // measured on what the buyer pays after shop discounts, whatever order
  // the codes were typed in.
  wanted.sort((a, b) => Number(!byCode.get(a)?.vendor_id) - Number(!byCode.get(b)?.vendor_id));

  const now = Date.now();
  let platformUsed = false;
  const sellerUsed = new Set<string>();

  for (const code of wanted) {
    const v = byCode.get(code);
    if (!v || v.status !== "active") { errors.push(`${code}: invalid code`); continue; }
    if (new Date(v.starts_at).getTime() > now) { errors.push(`${code}: not started yet`); continue; }
    if (v.ends_at && new Date(v.ends_at).getTime() <= now) { errors.push(`${code}: expired`); continue; }
    if (v.usage_limit != null && v.used_count >= v.usage_limit) { errors.push(`${code}: fully redeemed`); continue; }

    if (who.customerId || who.phone) {
      let q = admin.from("voucher_redemptions").select("id", { count: "exact", head: true }).eq("voucher_id", v.id);
      q = who.customerId ? q.eq("customer_id", who.customerId) : q.eq("phone", who.phone!);
      const { count } = await q;
      if ((count ?? 0) >= v.per_user_limit) { errors.push(`${code}: already used`); continue; }
    }

    // Delivery money isn't the seller's to discount, so free shipping is a
    // platform-only voucher type.
    if (v.vendor_id && v.kind === "free_shipping") { errors.push(`${code}: invalid code`); continue; }
    const targets = v.vendor_id ? groups.filter((g) => g.vendor_id === v.vendor_id) : groups;
    if (!targets.length) { errors.push(`${code}: only for items from that shop`); continue; }
    if (v.vendor_id ? sellerUsed.has(v.vendor_id) : platformUsed) {
      errors.push(`${code}: only one ${v.vendor_id ? "shop" : "platform"} voucher per order`);
      continue;
    }

    // Eligible base = goods after any seller discount already applied.
    const base = money(targets.reduce((s, g) => s + g.subtotal - g.discount, 0));
    if (base < Number(v.min_spend)) { errors.push(`${code}: min spend ৳${Number(v.min_spend).toLocaleString()}`); continue; }

    let amount: number;
    if (v.kind === "free_shipping") {
      const ship = targets.reduce((s, g) => s + g.shipping_cost, 0);
      amount = money(Math.min(ship, v.max_discount ?? Infinity));
    } else if (v.kind === "percent") {
      amount = money(Math.min(base * (Number(v.value) / 100), v.max_discount ?? Infinity));
    } else {
      amount = money(Math.min(Number(v.value), base));
    }
    if (amount <= 0) { errors.push(`${code}: nothing to discount`); continue; }

    if (v.vendor_id) {
      // Seller-funded: capped at that seller's goods (shipping is the
      // courier's money, not the seller's to give away) unless free shipping.
      targets[0].discount = money(targets[0].discount + amount);
      sellerUsed.add(v.vendor_id);
    } else {
      // Platform-funded: spread across parcels.
      if (v.kind === "free_shipping") {
        let left = amount;
        for (const g of targets) {
          const take = money(Math.min(left, g.shipping_cost));
          g.platform_discount = money(g.platform_discount + take);
          left = money(left - take);
        }
      } else {
        let left = amount;
        targets.forEach((g, i) => {
          const share = i === targets.length - 1 ? left : money(amount * ((g.subtotal - g.discount) / base));
          const take = money(Math.min(share, left));
          g.platform_discount = money(g.platform_discount + take);
          left = money(left - take);
        });
      }
      platformUsed = true;
    }
    applied.push({ voucher_id: v.id, code: v.code, title: v.title, vendor_id: v.vendor_id, amount });
  }
  return { applied, errors };
}

/** Public vouchers a shopper can see: platform-wide plus the given sellers'. */
export async function listPublicVouchers(admin: Admin, tenantId: string, vendorIds?: string[]) {
  const now = new Date().toISOString();
  let q = admin
    .from("vouchers")
    .select("id, vendor_id, code, title, kind, value, max_discount, min_spend, ends_at, usage_limit, used_count, vendors(name)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("is_public", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(30);
  if (vendorIds) q = vendorIds.length ? q.or(`vendor_id.is.null,vendor_id.in.(${vendorIds.join(",")})`) : q.is("vendor_id", null);
  const { data } = await q;
  return (data ?? []).filter((v) => v.usage_limit == null || v.used_count < v.usage_limit);
}
