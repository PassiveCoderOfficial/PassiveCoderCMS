import { sendEmail } from "@/lib/email";
import { getSiteSender } from "@/lib/email/sender";
import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { syncBookingToENM, type PcBookingStatus } from "@/lib/enm/booking-sync";


export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: settings }, { data: availability }, { data: blocked }, { data: appointments }] = await Promise.all([
    supabase.from("booking_settings").select("*").eq("tenant_id", tenantId).single(),
    supabase.from("booking_availability").select("*").eq("tenant_id", tenantId).order("day_of_week"),
    supabase.from("booking_blocked_dates").select("*").eq("tenant_id", tenantId).order("blocked_date"),
    supabase.from("booking_appointments").select("*").eq("tenant_id", tenantId).order("date", { ascending: false }).limit(200),
  ]);

  return NextResponse.json({
    settings: settings ?? null,
    availability: availability ?? [],
    blocked: blocked ?? [],
    appointments: appointments ?? [],
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "settings") {
    const { _type, ...fields } = body;
    const { data: existing } = await supabase.from("booking_settings").select("id").eq("tenant_id", tenantId).single();
    if (existing) {
      await supabase.from("booking_settings").update({ ...fields, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    } else {
      await supabase.from("booking_settings").insert({ ...fields, tenant_id: tenantId });
    }
    return NextResponse.json({ ok: true });
  }

  if (body._type === "availability") {
    // Upsert all 7 days at once
    const rows = (body.rows as Array<{ day_of_week: number; open_time: string; close_time: string; is_open: boolean }>).map((r) => ({
      ...r,
      tenant_id: tenantId,
    }));
    await supabase.from("booking_availability").upsert(rows, { onConflict: "tenant_id,day_of_week" });
    return NextResponse.json({ ok: true });
  }

  if (body._type === "blocked") {
    const { data, error } = await supabase.from("booking_blocked_dates")
      .insert({ tenant_id: tenantId, blocked_date: body.blocked_date, reason: body.reason ?? null })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...fields } = await req.json();

  if (_type === "appointment") {
    // Only the fields the dashboard edits — never tenant_id or customer data.
    const allowed: Record<string, unknown> = {};
    if (["pending", "confirmed", "cancelled", "completed", "no_show"].includes(fields.status)) allowed.status = fields.status;
    if (typeof fields.admin_note === "string") allowed.admin_note = fields.admin_note.slice(0, 2000);
    await supabase.from("booking_appointments")
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq("id", id).eq("tenant_id", tenantId);

    // Push the lifecycle change to ENM after the response — a completed job
    // there starts the review-request sequence.
    if (fields.status) {
      after(async () => {
        const { data: appt } = await supabase
          .from("booking_appointments")
          .select("id, date, start_time, end_time, customer_name, customer_email, customer_phone, message, status")
          .eq("id", id).eq("tenant_id", tenantId).single();
        if (!appt) return;

        // Tell the customer when their booking is confirmed or cancelled.
        if ((appt.status === "confirmed" || appt.status === "cancelled") && appt.customer_email) {
          const { data: ss } = await supabase.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle();
          const shop = String(ss?.site_name || "Our team").replace(/[<>"]/g, "");
          const when = `${new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${String(appt.start_time).slice(0, 5)}`;
          const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
          await sendEmail({
            to: appt.customer_email,
            ...(await getSiteSender(tenantId)),
            subject: appt.status === "confirmed" ? `Your booking is confirmed: ${when}` : `Your booking on ${when} was cancelled`,
            html: appt.status === "confirmed"
              ? `<p>Hi ${esc(appt.customer_name ?? "there")},</p><p>Your booking with <b>${esc(shop)}</b> is confirmed for <b>${when}</b>.</p><p>See you then.</p>`
              : `<p>Hi ${esc(appt.customer_name ?? "there")},</p><p>Your booking with <b>${esc(shop)}</b> on <b>${when}</b> has been cancelled. Reply or contact us to book another time.</p>`,
          }).catch(() => {});
        }

        const { data: integration } = await supabase
          .from("tenant_enm_integration")
          .select("enm_api_key, sync_bookings")
          .eq("tenant_id", tenantId).single();
        if (!integration?.sync_bookings || !integration.enm_api_key) return;

        await syncBookingToENM(integration.enm_api_key, {
          appointmentId: appt.id,
          tenantId,
          status: appt.status as PcBookingStatus,
          scheduledAt: `${appt.date}T${appt.start_time}`,
          endsAt: appt.end_time ? `${appt.date}T${appt.end_time}` : undefined,
          customerName: appt.customer_name,
          customerEmail: appt.customer_email,
          customerPhone: appt.customer_phone ?? undefined,
          message: appt.message ?? undefined,
        });

        await supabase
          .from("tenant_enm_integration")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("tenant_id", tenantId);
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (type === "blocked") {
    await supabase.from("booking_blocked_dates").delete().eq("id", id).eq("tenant_id", tenantId);
  } else if (type === "appointment") {
    await supabase.from("booking_appointments").delete().eq("id", id).eq("tenant_id", tenantId);
  }

  return NextResponse.json({ ok: true });
}
