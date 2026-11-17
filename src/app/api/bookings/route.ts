import { sendEmail } from "@/lib/email";
import { getSiteSender } from "@/lib/email/sender";
import { NextResponse, after } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { tooMany } from "@/lib/rate-limit";
import { inviteAfterBooking } from "@/lib/experts/reviews";


export async function GET() {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
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
  const limited = tooMany(req, "booking", 20);
  if (limited) return limited;
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
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
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...fields } = await req.json();

  if (_type === "appointment") {
    // Only the fields the dashboard edits — never tenant_id or customer data.
    const allowed: Record<string, unknown> = {};
    if (["pending", "confirmed", "cancelled", "completed", "no_show"].includes(fields.status)) allowed.status = fields.status;
    if (typeof fields.admin_note === "string") allowed.admin_note = fields.admin_note.slice(0, 2000);
    if (["due", "reported", "received"].includes(fields.deposit_status)) allowed.deposit_status = fields.deposit_status;
    // Staff assignment (mobile admin): null clears it; anyone else must be a
    // member of this site.
    if ("assigned_to" in fields) {
      if (fields.assigned_to === null) allowed.assigned_to = null;
      else if (typeof fields.assigned_to === "string") {
        const { data: member } = await supabase.from("tenant_members").select("user_id")
          .eq("tenant_id", tenantId).eq("user_id", fields.assigned_to).maybeSingle();
        const { data: owner } = member ? { data: null } : await supabase.from("tenants").select("owner_id")
          .eq("id", tenantId).eq("owner_id", fields.assigned_to).maybeSingle();
        if (!member && !owner) return NextResponse.json({ error: "That person is not on this site's team." }, { status: 400 });
        allowed.assigned_to = fields.assigned_to;
      }
    }
    // Reschedule by the owner: keep the booked length, move date/start.
    let movedFrom: string | null = null;
    if (fields.date !== undefined || fields.start_time !== undefined) {
      const date = String(fields.date ?? ""), start = String(fields.start_time ?? "").slice(0, 5);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) {
        return NextResponse.json({ error: "Pick a date and time" }, { status: 400 });
      }
      const { data: cur } = await supabase.from("booking_appointments").select("date, start_time, end_time")
        .eq("id", id).eq("tenant_id", tenantId).maybeSingle();
      if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const mins = (v: string) => { const [h, m] = String(v).slice(0, 5).split(":").map(Number); return h * 60 + m; };
      const length = Math.max(5, mins(cur.end_time) - mins(cur.start_time));
      const endMin = Math.min(mins(start) + length, 23 * 60 + 59);
      const hhmm = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
      allowed.date = date;
      allowed.start_time = start;
      allowed.end_time = hhmm(endMin);
      movedFrom = `${cur.date} ${String(cur.start_time).slice(0, 5)}`;
    }
    await supabase.from("booking_appointments")
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq("id", id).eq("tenant_id", tenantId);

    if (movedFrom) {
      after(async () => {
        const { data: appt } = await supabase.from("booking_appointments")
          .select("date, start_time, customer_name, customer_email, manage_token, visit_label")
          .eq("id", id).eq("tenant_id", tenantId).single();
        if (!appt?.customer_email) return;
        const { data: ss } = await supabase.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle();
        const shop = String(ss?.site_name || "Our team").replace(/[<>"]/g, "");
        const when = `${new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${String(appt.start_time).slice(0, 5)}`;
        const name = String(appt.customer_name ?? "there").replace(/[&<>"]/g, "");
        const word = String(appt.visit_label ?? "booking").replace(/[&<>"]/g, "");
        await sendEmail({
          to: appt.customer_email,
          ...(await getSiteSender(tenantId)),
          subject: `Your ${word} has moved: ${when}`,
          html: `<p>Hi ${name},</p><p>Your ${word} with <b>${shop}</b> has been moved to <b>${when}</b>.</p><p>Reply to this email if the new time does not suit you.</p>`,
        }).catch(() => {});
      });
    }

    // After the response: customer emails and the Experts review link.
    if (fields.status) {
      after(async () => {
        const { data: appt } = await supabase
          .from("booking_appointments")
          .select("id, date, start_time, end_time, customer_name, customer_email, customer_phone, message, status, visit_label")
          .eq("id", id).eq("tenant_id", tenantId).single();
        if (!appt) return;

        // Tell the customer when their booking is confirmed or cancelled.
        if ((appt.status === "confirmed" || appt.status === "cancelled") && appt.customer_email) {
          const { data: ss } = await supabase.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle();
          const shop = String(ss?.site_name || "Our team").replace(/[<>"]/g, "");
          const when = `${new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${String(appt.start_time).slice(0, 5)}`;
          const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
          const word = esc(String(appt.visit_label ?? "booking"));
          await sendEmail({
            to: appt.customer_email,
            ...(await getSiteSender(tenantId)),
            subject: appt.status === "confirmed" ? `Your ${word} is confirmed: ${when}` : `Your ${word} on ${when} was cancelled`,
            html: appt.status === "confirmed"
              ? `<p>Hi ${esc(appt.customer_name ?? "there")},</p><p>Your ${word} with <b>${esc(shop)}</b> is confirmed for <b>${when}</b>.</p><p>See you then.</p>`
              : `<p>Hi ${esc(appt.customer_name ?? "there")},</p><p>Your ${word} with <b>${esc(shop)}</b> on <b>${when}</b> has been cancelled. Reply or contact us to ${appt.visit_label ? "arrange" : "book"} another time.</p>`,
          }).catch(() => {});
        }

        // Experts review link (Pro/Biz sites with a listing; once per booking).
        if (appt.status === "completed" && fields.status === "completed") await inviteAfterBooking(await createAdminClient(), tenantId, appt.id);
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
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
