import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import ReservationsClient from "./reservations-client";

export const metadata = { title: "Reservations — Dashboard" };

/**
 * Table reservation management (Tier 2, docs/business/06-restaurant-vertical.md
 * item #2). Deliberately simple: a time slot + party size against one
 * branch, no specific-table assignment or availability engine — staff
 * confirm/manage by eye, same as most small restaurants do today.
 *
 * Shows the next 30 days from today, ordered by time — a reservations list
 * is read chronologically ("what's coming up"), not most-recent-first like
 * an order list.
 */
export default async function ReservationsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);

  const [{ data: branches }, { data: reservations }] = await Promise.all([
    supabase.from("restaurant_branches").select("id, name").eq("tenant_id", tid).eq("is_active", true),
    supabase.from("restaurant_reservations")
      .select("*")
      .eq("tenant_id", tid)
      .gte("reserved_at", now.toISOString())
      .lte("reserved_at", in30.toISOString())
      .order("reserved_at", { ascending: true }),
  ]);

  return <ReservationsClient branches={branches ?? []} reservations={reservations ?? []} />;
}
