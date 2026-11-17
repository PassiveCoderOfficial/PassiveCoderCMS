/** Open edition: no Experts directory, so no review invites after bookings or won deals. */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function inviteAfterBooking(_admin: SupabaseClient, _tenantId: string, _bookingId: string): Promise<void> {}

export async function inviteAfterWon(_admin: SupabaseClient, _tenantId: string, _contactId: string): Promise<void> {}
