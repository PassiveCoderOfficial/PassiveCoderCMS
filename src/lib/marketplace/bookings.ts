import { createAdminClient } from "@/lib/supabase/server";
import { upsertContact, normalizePhone } from "@/lib/crm/upsertContact";
import { computeVendorSlots } from "./slots";

export interface CreateBookingInput {
  tenantId: string;
  vendorId?: string | null;
  subcategoryId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  price?: number | null;
  notes?: string | null;
  /** "public" enforces slot validation against the vendor's live calendar
   *  when a vendor+date+time are given. "manual" (admin) skips it — staff
   *  can book a vendor's calendar-less/off-hours slot deliberately. */
  source?: "manual" | "public";
}

export type CreateBookingResult = { id: string } | { error: string };

/** Snapshot the vendor's commission_rate at booking time so later rate
 *  changes on the vendor never rewrite historical bookings. */
export function computeCommission(price: number | null | undefined, commissionRate: number | null | undefined) {
  if (price == null || commissionRate == null) return { commissionRate: commissionRate ?? null, commissionAmount: null };
  const amount = Math.round(price * (commissionRate / 100) * 100) / 100;
  return { commissionRate, commissionAmount: amount };
}

/** Create a marketplace booking, upserting the customer into CRM contacts
 *  (mirrors the pattern in src/app/api/jobs/route.ts POST). When a vendor +
 *  date + time are given from the public storefront, the slot is
 *  re-validated server-side against that vendor's live availability
 *  (src/lib/marketplace/slots.ts) — never trust the widget. */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const supabase = await createAdminClient();

  let vendorCommissionRate: number | null = null;
  if (input.vendorId) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("commission_rate")
      .eq("id", input.vendorId)
      .eq("tenant_id", input.tenantId)
      .maybeSingle();
    vendorCommissionRate = vendor?.commission_rate ?? null;
  }
  const { commissionRate, commissionAmount } = computeCommission(input.price, vendorCommissionRate);

  let scheduledEndTime: string | null = null;
  if (input.source === "public" && input.vendorId && input.scheduledDate && input.scheduledTime) {
    const { slots, error } = await computeVendorSlots(input.vendorId, input.scheduledDate);
    if (error) return { error };
    const slot = slots.find((s) => s.start === input.scheduledTime);
    if (!slot) return { error: "That time is no longer available" };
    scheduledEndTime = slot.end;
  }

  let contactId: string | null = null;
  if (input.customerPhone || input.customerEmail) {
    contactId = await upsertContact({
      tenantId: input.tenantId,
      name: input.customerName,
      phone: input.customerPhone,
      email: input.customerEmail,
      source: "booking",
      event: { type: "booking", title: "Marketplace booking created" },
    }).catch(() => null);
  }

  const { data, error: insertError } = await supabase
    .from("marketplace_bookings")
    .insert({
      tenant_id: input.tenantId,
      contact_id: contactId,
      vendor_id: input.vendorId || null,
      subcategory_id: input.subcategoryId || null,
      customer_name: input.customerName?.trim() || null,
      customer_phone: normalizePhone(input.customerPhone) ?? input.customerPhone?.trim() ?? null,
      address: input.address?.trim() || null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      status: input.vendorId ? "confirmed" : "pending",
      scheduled_date: input.scheduledDate || null,
      scheduled_time: input.scheduledTime || null,
      scheduled_end_time: scheduledEndTime,
      price: input.price ?? null,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    // Unique index marketplace_bookings_vendor_slot_uq — two customers raced the same slot.
    if (insertError?.code === "23505") return { error: "That time is no longer available" };
    return { error: "Failed to create booking" };
  }
  return { id: data.id };
}
