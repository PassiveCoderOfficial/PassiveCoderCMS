import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import BookingsClient from "./bookings-client";

export const metadata = { title: "Marketplace Bookings — Dashboard" };

export default async function MarketplaceBookingsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: bookings }, { data: vendors }, { data: categories }] = await Promise.all([
    supabase.from("marketplace_bookings")
      .select("*, vendors(id, name, phone), service_subcategories(id, name)")
      .eq("tenant_id", tid)
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("vendors").select("id, name, status").eq("tenant_id", tid).eq("status", "approved").order("name"),
    supabase.from("service_categories").select("*, service_subcategories(*)").eq("tenant_id", tid).order("sort_order"),
  ]);

  return <BookingsClient initialBookings={bookings ?? []} vendors={vendors ?? []} categories={categories ?? []} />;
}
