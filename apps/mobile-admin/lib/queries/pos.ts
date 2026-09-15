// POS ring-up — the ONE restaurant-vertical write that genuinely needs the
// server route (cms/src/app/api/ecommerce/pos), not a direct Supabase
// write: it decrements stock, posts an accounting transaction, and
// optionally upserts a CRM contact — real side effects that must run
// server-side, not be reproduced client-side.

import { apiFetch } from "../api";
import { supabase } from "../supabase";

export interface CartLine {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PosCheckoutResult {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  error?: string;
}

export interface PosProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number | null;
  track_inventory: boolean;
}

export async function getProducts(tenantId: string): Promise<PosProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, price, stock_quantity, track_inventory")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function ringUpSale(
  tenantId: string,
  input: {
    items: CartLine[];
    discount: number;
    payment_method: string;
    customer_name?: string;
    customer_phone?: string;
    branch_id?: string;
    table_id?: string;
    split_group_id?: string;
    split_label?: string;
  },
): Promise<PosCheckoutResult> {
  const res = await apiFetch<{ orderId: string; orderNumber: string; total: number; error?: string }>(
    "/api/ecommerce/pos",
    { method: "POST", body: input, tenantId },
  );
  if (!res.ok) return { ok: false, error: res.data.error ?? `Sale failed (${res.status})` };
  return { ok: true, orderId: res.data.orderId, orderNumber: res.data.orderNumber, total: res.data.total };
}
