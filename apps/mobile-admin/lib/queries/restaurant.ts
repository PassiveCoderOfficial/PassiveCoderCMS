// Restaurant vertical reads/writes — direct Supabase, RLS-scoped, same
// pattern as lib/queries/dashboard.ts and leads.ts. None of these tables'
// web-side API routes (cms/src/app/api/ecommerce/branches|riders|
// reservations|kitchen) have side effects beyond the row write itself
// (verified: no stock decrement, no accounting entry, no CRM upsert) — RLS
// policies (*_tenant_manage, keyed off is_tenant_member(tenant_id), same
// check apiTenantId() itself relies on) already cover a real logged-in
// tenant member doing the same writes those routes do. Only POS
// (lib/queries/pos.ts) needs the actual server route, for its accounting/
// stock/CRM side effects.

import { supabase } from "../supabase";

export interface RestaurantBranch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  kitchen_screen_enabled: boolean;
  monitor_screen_enabled: boolean;
  table_screen_enabled: boolean;
}

export interface RestaurantTable {
  id: string;
  branch_id: string;
  table_number: string;
  qr_token: string;
  is_active: boolean;
  table_pin: string | null;
}

export interface Rider {
  id: string;
  branch_id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  rider_token: string;
  last_lat: number | null;
  last_lng: number | null;
  last_location_at: string | null;
}

export interface Reservation {
  id: string;
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reserved_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  notes: string | null;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  items: OrderItem[];
  branch_id: string | null;
  table_id: string | null;
  kitchen_status: string;
  fulfillment_type: string;
  customer_name: string;
  created_at: string;
  rider_id: string | null;
  delivery_status: string | null;
}

// ─── Branches + tables ──────────────────────────────────────────────────

export async function getBranches(tenantId: string): Promise<RestaurantBranch[]> {
  const { data, error } = await supabase
    .from("restaurant_branches")
    .select("id, name, address, phone, is_active, kitchen_screen_enabled, monitor_screen_enabled, table_screen_enabled")
    .eq("tenant_id", tenantId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function getTables(branchId: string): Promise<RestaurantTable[]> {
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id, branch_id, table_number, qr_token, is_active, table_pin")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .order("table_number");
  if (error) throw error;
  return data ?? [];
}

export async function createBranch(tenantId: string, name: string, address?: string, phone?: string): Promise<RestaurantBranch> {
  const { data, error } = await supabase
    .from("restaurant_branches")
    .insert({ tenant_id: tenantId, name: name.trim(), address: address?.trim() || null, phone: phone?.trim() || null })
    .select("id, name, address, phone, is_active, kitchen_screen_enabled, monitor_screen_enabled, table_screen_enabled")
    .single();
  if (error) throw error;
  return data;
}

export async function toggleBranchScreen(
  branchId: string,
  field: "kitchen_screen_enabled" | "monitor_screen_enabled" | "table_screen_enabled",
  value: boolean,
): Promise<void> {
  const { error } = await supabase.from("restaurant_branches").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", branchId);
  if (error) throw error;
}

// ─── Riders ─────────────────────────────────────────────────────────────

export async function getRiders(tenantId: string): Promise<Rider[]> {
  // No direct tenant_id column on restaurant_riders — scoped through its
  // branch, same join the web's kitchen page.tsx query uses.
  const { data, error } = await supabase
    .from("restaurant_riders")
    .select("id, branch_id, name, phone, is_active, rider_token, last_lat, last_lng, last_location_at, restaurant_branches!inner(tenant_id)")
    .eq("is_active", true)
    .eq("restaurant_branches.tenant_id", tenantId);
  if (error) throw error;
  return (data ?? []) as unknown as Rider[];
}

export async function createRider(branchId: string, name: string, phone?: string): Promise<Rider> {
  const { data, error } = await supabase
    .from("restaurant_riders")
    .insert({ branch_id: branchId, name: name.trim(), phone: phone?.trim() || null })
    .select("id, branch_id, name, phone, is_active, rider_token, last_lat, last_lng, last_location_at")
    .single();
  if (error) throw error;
  return data;
}

// ─── Reservations ───────────────────────────────────────────────────────

export async function getReservations(tenantId: string, sinceIso: string, untilIso: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("restaurant_reservations")
    .select("id, branch_id, customer_name, customer_phone, party_size, reserved_at, status, notes")
    .eq("tenant_id", tenantId)
    .gte("reserved_at", sinceIso)
    .lte("reserved_at", untilIso)
    .order("reserved_at");
  if (error) throw error;
  return data ?? [];
}

export async function createReservation(
  tenantId: string,
  branchId: string,
  input: { customer_name: string; customer_phone: string; party_size: number; reserved_at: string; notes?: string },
): Promise<Reservation> {
  const { data, error } = await supabase
    .from("restaurant_reservations")
    .insert({
      tenant_id: tenantId, branch_id: branchId,
      customer_name: input.customer_name.trim(), customer_phone: input.customer_phone.trim(),
      party_size: input.party_size, reserved_at: input.reserved_at, notes: input.notes?.trim() || null,
      status: "confirmed", // staff entering it directly, same reasoning as the web route
    })
    .select("id, branch_id, customer_name, customer_phone, party_size, reserved_at, status, notes")
    .single();
  if (error) throw error;
  return data;
}

export async function updateReservationStatus(id: string, status: Reservation["status"]): Promise<void> {
  const { error } = await supabase.from("restaurant_reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ─── Kitchen ────────────────────────────────────────────────────────────

// Terminal per fulfillment type (migration 092, docs/business/06-restaurant-vertical.md):
// dine-in ends at "served", pickup at "picked_up", delivery at "completed".
const TERMINAL = ["served", "picked_up", "completed"];

export async function getKitchenOrders(tenantId: string): Promise<KitchenOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, items, branch_id, table_id, kitchen_status, fulfillment_type, customer_name, created_at, rider_id, delivery_status")
    .eq("tenant_id", tenantId)
    .not("kitchen_status", "is", null)
    .not("kitchen_status", "in", `(${TERMINAL.join(",")})`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as KitchenOrder[];
}

/** Same tenant_id-scoped-in-the-update pattern as api/ecommerce/kitchen's
 *  POST — no separate read-then-write, closes the same cross-tenant gap
 *  that route's own comment documents. */
export async function advanceKitchenStatus(orderId: string, tenantId: string, kitchenStatus: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ kitchen_status: kitchenStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}
