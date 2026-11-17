import "server-only";
import { after } from "next/server";
import { enrollInSequences } from "@/lib/crm/sequences";
import { getSiteSender } from "@/lib/email/sender";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { upsertContact, type UpsertContactInput } from "@/lib/crm/upsertContact";
import { computeSlots, depositOf, fmtDeposit } from "@/lib/booking/slots";
import { getStorePaymentMethods } from "@/lib/ecommerce/payment-methods";
import { publicUrl } from "@/lib/tenant/site-urls";
import { notifyTenantEvent } from "@/lib/push/notify";
import { isBlockedSender } from "@/lib/spam/guard";
import { visitCustomerEmail } from "@/lib/site-chat/intake-rules";
import type { IntakeLang } from "@/lib/site-chat/intake-copy";

/**
 * Public booking for one site, shared by the site's own booking block
 * (api/bookings/public, tenant from the host) and Experts profiles
 * (api/experts/booking, tenant from the expert). One slot rule, one insert,
 * the same emails, push, CRM contact and follow-up sequences.
 */
export type BookingResult = {
  status: number;
  /** What a public route may return to the browser. */
  body: Record<string, unknown>;
  /** For server callers only (never in `body`). */
  appointmentId?: string;
  contactId?: string | null;
};

/**
 * The website chat's job intake books through this same path with its own
 * wording and richer alerts. Every other caller passes none of this and gets
 * the same emails, pushes and "booking" wording as before.
 */
export type BookingOptions = {
  /** What this site calls it ("site visit"): replaces "booking" in every message about this appointment. */
  visitLabel?: string;
  lang?: IntakeLang;
  /** The time as the customer's email should show it. */
  whenLabel?: string;
  conversationId?: string;
  session?: string;
  /** The caller alerts the owner itself. */
  quietOwner?: boolean;
  /** Running inside a response stream: after() is not available there, so wait for the follow ups. */
  inStream?: boolean;
  contact?: Pick<UpsertContactInput, "source" | "tags" | "custom" | "quiet"> & { title: string; body: string; meta?: Record<string, unknown> };
};
const json = (body: Record<string, unknown>, status = 200): BookingResult => ({ status, body });

/** Open slots on a date (YYYY-MM-DD) plus the site's contact rule. */
export async function publicSlots(tenantId: string, date: string | null): Promise<BookingResult> {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Invalid date" }, 400);

  const [{ slots, error }, contactRequirement] = await Promise.all([
    computeSlots(tenantId, date),
    getContactRequirement(tenantId),
  ]);
  return json({ slots, contactRequirement, ...(error ? { error } : {}) });
}

type ContactRequirement = "either" | "both";

async function getContactRequirement(tenantId: string): Promise<ContactRequirement> {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("booking_settings")
    .select("contact_requirement").eq("tenant_id", tenantId).maybeSingle();
  return data?.contact_requirement === "both" ? "both" : "either";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email OR phone by default; both when the site requires it. */
function contactError(req: ContactRequirement, email: string, phone: string): string | null {
  if (email && !EMAIL_RE.test(email)) return "Please enter a valid email address";
  if (phone && phone.replace(/\D/g, "").length < 6) return "Please enter a valid phone / WhatsApp number";
  if (req === "both" && (!email || !phone)) return "Please enter both your email and phone / WhatsApp number";
  if (!email && !phone) return "Please enter your email or phone / WhatsApp number";
  return null;
}

/** Create an appointment from a public widget. `via` tags where it came from (CRM timeline). */
export async function createPublicBooking(tenantId: string, body: Record<string, unknown> | null, via?: string, ip?: string, opts: BookingOptions = {}): Promise<BookingResult> {
  const { date, start, name, message } = (body ?? {}) as { date?: string; start?: string; name?: string; message?: string };
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!date || !start || !name?.trim()) {
    return json({ error: "Missing required fields" }, 400);
  }
  const contactErr = contactError(await getContactRequirement(tenantId), email, phone);
  if (contactErr) return json({ error: contactErr }, 400);
  if (await isBlockedSender(tenantId, { email, phone, ip, session: opts.session }, "booking", { name: name.trim(), email, phone, date, start, message: message ?? "" })) {
    return json({ ok: true, status: "pending", message: "Your appointment request has been received!", emailed: false, manageUrl: null, token: null, deposit: null });
  }

  // Server-side slot validation — never trust the widget
  const { slots, error } = await computeSlots(tenantId, date);
  const slot = slots.find((s) => s.start === start);
  if (error) return json({ error }, 400);
  if (!slot) return json({ error: "That time is no longer available" }, 409);

  const supabase = await createAdminClient();
  const [{ data: settings }, { data: site }] = await Promise.all([
    supabase.from("booking_settings")
      .select("confirmation_mode, service_name, success_message, notify_email, deposit_required, deposit_amount, deposit_currency, deposit_note")
      .eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("tenants").select("slug, custom_domain").eq("id", tenantId).maybeSingle(),
  ]);

  const status = settings?.confirmation_mode === "auto" ? "confirmed" : "pending";
  const deposit = depositOf(settings);

  const { data: appt, error: insErr } = await supabase.from("booking_appointments")
    .insert({
      tenant_id: tenantId,
      date,
      start_time: slot.start,
      end_time: slot.end,
      customer_name: name.trim(),
      customer_email: email || null,
      customer_phone: phone || null,
      message: message?.trim() || null,
      status,
      deposit_status: deposit.required ? "due" : "none",
      ...(opts.visitLabel ? { visit_label: opts.visitLabel } : {}),
      ...(opts.conversationId ? { chat_conversation_id: opts.conversationId } : {}),
    })
    .select("id, manage_token")
    .single();

  if (insErr) return json({ error: "Failed to book" }, 500);

  // The slot check above and the insert are not atomic. Two people taking the
  // last slot together: the earlier row keeps it and the later one steps back.
  const { data: rivals } = await supabase.from("booking_appointments").select("id, created_at")
    .eq("tenant_id", tenantId).eq("date", date).eq("start_time", slot.start).neq("status", "cancelled");
  const first = (rivals ?? []).slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)) || String(a.id).localeCompare(String(b.id)))[0];
  if (first && first.id !== appt.id) {
    await supabase.from("booking_appointments").delete().eq("id", appt.id).eq("tenant_id", tenantId);
    return json({ error: "That time is no longer available" }, 409);
  }

  // The customer's private link: cancel, reschedule, report the deposit.
  const manageUrl = publicUrl({ slug: site?.slug ?? "", custom_domain: site?.custom_domain ?? null }, `/book/manage/${appt.manage_token}`);
  const methods = deposit.required ? await getStorePaymentMethods(tenantId, deposit.currency ?? "BDT") : [];

  if (!opts.quietOwner) await notifyTenantEvent({ tenantId, type: "booking", id: appt.id, dedupeKey: `booking:${appt.id}`, title: `New booking: ${name}`, body: `${settings?.service_name ?? "Appointment"} on ${date} at ${slot.start}`, webUrl: "/dashboard/bookings" });

  // CRM: booking auto-creates/updates a contact with a timeline event
  const bookingContactId = await upsertContact({
    tenantId,
    email: email || undefined,
    phone: phone || undefined,
    name,
    source: opts.contact?.source ?? "booking",
    tags: opts.contact?.tags,
    custom: opts.contact?.custom,
    quiet: opts.contact?.quiet,
    event: {
      type: "booking",
      title: opts.contact?.title ?? `Booked ${settings?.service_name ?? "appointment"} — ${date} ${slot.start}`,
      body: opts.contact?.body ?? (message || null),
      meta: { appointment_id: appt.id, date, start: slot.start, status, ...(via ? { via } : {}), ...(opts.contact?.meta ?? {}) },
    },
  }).catch(() => null);
  // Follow-up sequences run after the response; never fail the booking.
  if (bookingContactId) {
    const enroll = () => enrollInSequences(tenantId, bookingContactId, "booking", {
      name, phone: phone || null, service: opts.visitLabel ?? settings?.service_name ?? "appointment",
    }).catch(() => undefined);
    if (opts.inStream) await enroll(); else after(enroll);
  }

  // Notify the business
  if (settings?.notify_email && !opts.quietOwner) {
    sendEmail({
      brandTenantId: tenantId, // white-label: reseller brand for their clients
      to: settings.notify_email,
      subject: `New booking: ${name} — ${date} ${slot.start}`,
      text: [
        `Service: ${settings.service_name ?? "Appointment"}`,
        `When: ${date} ${slot.start}–${slot.end}`,
        `Name: ${name}`,
        email ? `Email: ${email}` : null,
        phone ? `Phone: ${phone}` : null,
        message ? `Message: ${message}` : null,
        `Status: ${status}`,
      ].filter(Boolean).join("\n"),
    }).catch(() => null);
  }

  // Confirmation to the customer (phone-only bookings get none).
  if (email && opts.visitLabel) {
    const copy = visitCustomerEmail({
      lang: opts.lang ?? "en", word: opts.visitLabel, name: name.trim(), when: opts.whenLabel ?? `${date} ${slot.start}`, status, manageUrl,
      depositLines: deposit.required ? ["", `${fmtDeposit(deposit)}${deposit.note ? ` ${deposit.note}` : ""}`] : [],
    });
    await sendEmail({ ...(await getSiteSender(tenantId)), to: email, ...copy }).catch(() => null);
  } else if (email) sendEmail({
    ...(await getSiteSender(tenantId)),
    to: email,
    subject: status === "confirmed"
      ? `Booking confirmed — ${date} at ${slot.start}`
      : `Booking request received — ${date} at ${slot.start}`,
    text: [
      `Hi ${name},`,
      "",
      status === "confirmed"
        ? `Your ${settings?.service_name ?? "appointment"} is confirmed for ${date} at ${slot.start}.`
        : `We received your request for ${settings?.service_name ?? "an appointment"} on ${date} at ${slot.start}. We'll confirm shortly.`,
      ...(deposit.required ? [
        "",
        `A deposit of ${fmtDeposit(deposit)} secures this booking.${deposit.note ? ` ${deposit.note}` : ""}`,
        ...methods.map((m) => `${m.name}: ${Object.entries(m.settings).filter(([, v]) => v).map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(", ")}`),
        "After paying, enter the transaction reference on your booking page.",
      ] : []),
      "",
      `Need to change or cancel? ${manageUrl}`,
    ].join("\n"),
  }).catch(() => null);

  return {
    ...json({
      ok: true,
      status,
      message: settings?.success_message ?? "Your appointment request has been received!",
      emailed: !!email,
      manageUrl,
      token: appt.manage_token,
      deposit: deposit.required ? { ...deposit, label: fmtDeposit(deposit), methods } : null,
    }),
    appointmentId: appt.id,
    contactId: bookingContactId,
  };
}
