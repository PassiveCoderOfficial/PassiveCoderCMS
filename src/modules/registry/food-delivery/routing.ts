/**
 * Open edition: no restaurant or food delivery module. Every store routes
 * orders the plain shop way: pickup orders start 'pending', delivery orders
 * have no kitchen status, and no branch is chosen.
 */
import type { LatLng, Zone } from "./zones";

export type Fulfillment = "delivery" | "pickup" | "dine_in";
export type BranchPin = { id: string; lat: number | null; lng: number | null };
export type FoodCheckout = {
  restaurant: boolean;
  pin: "off" | "optional" | "required";
  zone: Zone | null;
  advanceAbove: number | null;
};
export type RoutingPlan =
  | { ok: true; branchId: string | null; kitchenStatus: "pending" | null; pin: LatLng | null }
  | { ok: false; error: string };

export function codBlocked(cfg: Pick<FoodCheckout, "advanceAbove">, total: number): boolean {
  return cfg.advanceAbove != null && total > cfg.advanceAbove;
}

export const ADVANCE_REQUIRED_ERROR = (limit: number) =>
  `For orders above ${Math.round(limit)} this store asks you to pay online first.`;

const validLatLng = (v: unknown): v is LatLng =>
  !!v && typeof v === "object" && Number.isFinite((v as LatLng).lat) && Number.isFinite((v as LatLng).lng);

export function planRouting(input: {
  cfg: FoodCheckout;
  fulfillment: Fulfillment;
  branches: BranchPin[];
  pin: unknown;
  tableBranchId?: string | null;
}): RoutingPlan {
  const { fulfillment } = input;
  const pin = validLatLng(input.pin) ? { lat: input.pin.lat, lng: input.pin.lng } : null;
  if (fulfillment === "dine_in") return { ok: true, branchId: input.tableBranchId ?? null, kitchenStatus: "pending", pin: null };
  return { ok: true, branchId: null, kitchenStatus: fulfillment === "pickup" ? "pending" : null, pin: fulfillment === "delivery" ? pin : null };
}
