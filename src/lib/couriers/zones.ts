/**
 * Delivery zones for marketplace parcels (client point 8: same-district
 * delivery from 70 Tk). Pure, so tests can import it.
 *
 * A parcel goes from the seller's pickup district to the customer's district:
 *  - same_district: both in one district (cheapest)
 *  - same_division: different districts in one division
 *  - other: anywhere else in Bangladesh
 * District names are matched loosely (case, spaces, punctuation and old
 * English spellings such as Chittagong, Bogra, Comilla, Jessore), always
 * resolving to the BD_LOCATIONS name.
 */
import { BD_LOCATIONS } from "../donors/bd-locations";

export type DeliveryZone = "same_district" | "same_division" | "other";
export const ZONES: DeliveryZone[] = ["same_district", "same_division", "other"];
export const ZONE_LABEL: Record<DeliveryZone, string> = {
  same_district: "Same district",
  same_division: "Same division",
  other: "Rest of Bangladesh",
};

/** District -> division, for every BD_LOCATIONS district. */
export const DISTRICT_DIVISION: Record<string, string> = {};
const DIVISIONS: Record<string, string[]> = {
  Dhaka: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  Chattogram: ["Chattogram", "Bandarban", "Brahmanbaria", "Chandpur", "Cox's Bazar", "Cumilla", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  Rajshahi: ["Rajshahi", "Bogura", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Sirajganj"],
  Khulna: ["Khulna", "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  Barishal: ["Barishal", "Barguna", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  Sylhet: ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj"],
  Rangpur: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};
for (const [div, list] of Object.entries(DIVISIONS)) for (const d of list) DISTRICT_DIVISION[d] = div;

const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** Older or courier spellings -> BD_LOCATIONS name (keys already normalised). */
const ALIASES: Record<string, string> = {
  chittagong: "Chattogram", ctg: "Chattogram", comilla: "Cumilla", bogra: "Bogura", barisal: "Barishal",
  jessore: "Jashore", bbaria: "Brahmanbaria", brahmanbaria: "Brahmanbaria", chapainawabganj: "Chapainawabganj",
  chapai: "Chapainawabganj", nawabganj: "Chapainawabganj", netrakona: "Netrokona", narshingdi: "Narsingdi",
  narsinghdi: "Narsingdi", munsiganj: "Munshiganj", gopalgonj: "Gopalganj", jhalokathi: "Jhalokati", jhalakathi: "Jhalokati",
  jhenidah: "Jhenaidah", jhinaidah: "Jhenaidah", khagrachari: "Khagrachhari", maulvibazar: "Moulvibazar",
  moulvibazaar: "Moulvibazar", coxsbazar: "Cox's Bazar", coxbazar: "Cox's Bazar", habigonj: "Habiganj",
  kishorganj: "Kishoreganj", laxmipur: "Lakshmipur", lakshmipur: "Lakshmipur", sirajgonj: "Sirajganj",
  rangamati: "Rangamati", panchagar: "Panchagarh", thakurgoan: "Thakurgaon", dhakacity: "Dhaka",
};

const CANON = new Map<string, string>(Object.keys(BD_LOCATIONS).map((d) => [key(d), d]));

/** The BD_LOCATIONS district name for a typed or courier-spelled district, or null. */
export function normalizeDistrict(name: string | null | undefined): string | null {
  if (!name) return null;
  const k = key(name);
  if (!k) return null;
  return CANON.get(k) ?? ALIASES[k] ?? null;
}

export function divisionOf(district: string | null | undefined): string | null {
  const d = normalizeDistrict(district);
  return d ? DISTRICT_DIVISION[d] ?? null : null;
}

/** Zone for a parcel, or null when either side has no known district (use the old area rates). */
export function deliveryZone(vendorDistrict: string | null | undefined, customerDistrict: string | null | undefined): DeliveryZone | null {
  const v = normalizeDistrict(vendorDistrict);
  const c = normalizeDistrict(customerDistrict);
  if (!v || !c) return null;
  if (v === c) return "same_district";
  const dv = DISTRICT_DIVISION[v];
  if (dv && dv === DISTRICT_DIVISION[c]) return "same_division";
  return "other";
}

/** The rate row for a zone among a tenant's rates (rows with a zone column). */
export function rateForZone<R extends { zone?: string | null }>(rates: R[], zone: DeliveryZone | null): R | null {
  if (!zone) return null;
  return rates.find((r) => r.zone === zone) ?? null;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  free_above: number | null;
  cod_fee_pct: number;
  areas: string[];
  is_default: boolean;
  weight_included_kg?: number | null;
  extra_per_kg?: number | null;
  eta_days?: string | null;
  /** Set on zone rates; null on the older area-list rates. */
  zone?: string | null;
}

/** Delivery charge for one parcel: the rate covers weight_included_kg; each
 *  further kg, or part of one, adds extra_per_kg. Free above a parcel value
 *  still wins. Weight 0 (nothing weighed) is the flat rate. */
export function parcelShipping(rate: Pick<ShippingRate, "rate" | "free_above" | "weight_included_kg" | "extra_per_kg"> | null, subtotal: number, weightKg: number): number {
  if (!rate) return 0;
  if (rate.free_above != null && subtotal >= Number(rate.free_above)) return 0;
  const extraKg = Math.max(0, Math.ceil(Math.round((weightKg - Number(rate.weight_included_kg ?? 1)) * 1000) / 1000));
  return round2(Number(rate.rate) + extraKg * Number(rate.extra_per_kg ?? 0));
}

/** Resolve the older area-list rate for a delivery area. Falls back to the
 *  tenant's default rate when the area isn't explicitly listed, so an unknown
 *  upazila is still quotable. Zone rates are skipped here; when a tenant has
 *  only zone rates, the "other" zone is the fallback. */
export function rateForArea(rates: ShippingRate[], area: string | null | undefined | (string | null | undefined)[]): ShippingRate | null {
  const legacy = rates.filter((r) => !r.zone);
  if (!legacy.length) return rates.find((r) => r.zone === "other") ?? null;
  // Several candidates (thana, then district): the first one listed wins.
  for (const cand of Array.isArray(area) ? area : [area]) {
    if (!cand) continue;
    const needle = cand.trim().toLowerCase();
    const hit = legacy.find((r) => (r.areas ?? []).some((a) => a.toLowerCase() === needle));
    if (hit) return hit;
  }
  return legacy.find((r) => r.is_default) ?? legacy[0];
}

export interface ParcelPrice {
  cost: number;
  /** 'same_district' | 'same_division' | 'other', or the area rate's name. */
  zone: string | null;
  rate: ShippingRate | null;
}

/**
 * Price one seller's parcel. Zone pricing when both districts are known and
 * the tenant has a rate for that zone; otherwise the older area rate.
 */
export function priceParcel(
  rates: ShippingRate[],
  p: { vendorDistrict?: string | null; customerDistrict?: string | null; area?: string | null; subtotal: number; weightKg: number },
): ParcelPrice {
  const zone = deliveryZone(p.vendorDistrict, p.customerDistrict);
  const zr = rateForZone(rates, zone);
  if (zr) return { cost: parcelShipping(zr, p.subtotal, p.weightKg), zone, rate: zr };
  const legacy = rateForArea(rates, [p.area, p.customerDistrict]);
  return { cost: parcelShipping(legacy, p.subtotal, p.weightKg), zone: legacy ? (legacy.zone ?? legacy.name) : null, rate: legacy };
}
