import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingsClient from "./bookings-client";

export const metadata = { title: "Bookings — Dashboard" };

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
  if (!member?.tenant_id) redirect("/login?error=no_tenant");

  const tid = member.tenant_id;
  const [{ data: settings }, { data: availability }, { data: blocked }, { data: appointments }] = await Promise.all([
    supabase.from("booking_settings").select("*").eq("tenant_id", tid).single(),
    supabase.from("booking_availability").select("*").eq("tenant_id", tid).order("day_of_week"),
    supabase.from("booking_blocked_dates").select("*").eq("tenant_id", tid).order("blocked_date"),
    supabase.from("booking_appointments").select("*").eq("tenant_id", tid).order("date", { ascending: false }).limit(200),
  ]);

  return (
    <BookingsClient
      initialSettings={settings ?? null}
      initialAvailability={availability ?? []}
      initialBlocked={blocked ?? []}
      initialAppointments={appointments ?? []}
    />
  );
}
