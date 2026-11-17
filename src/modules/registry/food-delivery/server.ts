/** Open edition: no restaurant or food delivery module. */
import type { BranchPin, FoodCheckout } from "./routing";

export type FoodHubSettings = {
  tenant_id: string;
  zone: string | null;
  listed: boolean;
  use_pool: boolean;
  commission_pct: number;
  advance_above: number | null;
  rider_pays_above: number | null;
  prep_minutes: number;
  min_rider_pay: number;
  cancel_pickup_pay_pct: number;
  auto_call_rider: boolean;
};

export type KitchenJob = {
  id: string;
  order_id: string;
  status: string;
  offer_at: string;
  alerted_at: string | null;
  returning?: boolean;
  rider: { name: string; phone: string; lat: number | null; lng: number | null; seen_at: string | null } | null;
};

export async function getFoodHubSettings(_tenantId: string): Promise<FoodHubSettings | null> {
  return null;
}

export async function loadFoodCheckout(_tenantId: string | null): Promise<FoodCheckout> {
  return { restaurant: false, pin: "off", zone: null, advanceAbove: null };
}

export async function loadKitchenFood(_tenantId: string): Promise<{ enrolled: boolean; jobs: Record<string, KitchenJob> }> {
  return { enrolled: false, jobs: {} };
}

export async function loadBranchPins(_tenantId: string): Promise<BranchPin[]> {
  return [];
}
