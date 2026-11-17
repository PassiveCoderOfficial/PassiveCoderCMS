import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { RiderApp } from "./rider-app";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata = { title: "Deliveries" };

/**
 * Rider PWA (docs/business/06-restaurant-vertical.md Phase 6, Tier 1 item
 * #6) — thin layer on the existing rider/delivery_status backend from
 * Phase 4 (090_restaurant_riders.sql), no new delivery logic here.
 *
 * Riders have no auth.users account by deliberate design (090's own
 * comment) — "usually a name and a phone number, not someone who logs into
 * the dashboard". So this isn't behind login: rider_token in the URL
 * (migration 094) is the entire access control, same shape as
 * restaurant_tables.qr_token. No x-tenant-id header needed either — unlike
 * table/monitor pages, a rider link works from ANY device on ANY network
 * (a rider's own phone, not a tenant subdomain visit), so the token alone
 * resolves both the rider AND their tenant.
 */
export default async function RiderPage({ params }: Props) {
  const { token } = await params;

  const admin = await createAdminClient();
  const { data: rider } = await admin
    .from("restaurant_riders")
    .select("id, name, is_active, branch_id, restaurant_branches!inner(name, tenant_id)")
    .eq("rider_token", token)
    .maybeSingle();

  const branch = (rider as unknown as { restaurant_branches?: { name: string; tenant_id: string } } | null)?.restaurant_branches;

  if (!rider || !rider.is_active || !branch) notFound();

  return <RiderApp token={token} riderName={rider.name} branchName={branch.name} />;
}
