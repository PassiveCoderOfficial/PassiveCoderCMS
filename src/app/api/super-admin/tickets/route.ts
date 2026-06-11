import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";

async function authed() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null };
  if (!await isSuperAdmin(user.id)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), supabase: null };
  const supabase = await createAdminClient();
  return { error: null, supabase };
}

export async function GET(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const id = new URL(req.url).searchParams.get("id");

  const [ticketsResult, { data: depts }] = await Promise.all([
    id
      ? supabase!.from("support_tickets").select("*").eq("id", id).maybeSingle()
      : supabase!.from("support_tickets")
          .select("id,subject,department,priority,status,guest_name,guest_email,created_at,tenant_id")
          .order("created_at", { ascending: false }).limit(500),
    supabase!.from("support_departments").select("id,name,slug").order("sort_order"),
  ]);

  if (id) {
    return NextResponse.json({ ticket: ticketsResult.data ?? null, depts: depts ?? [] });
  }
  return NextResponse.json({ tickets: (ticketsResult as { data: unknown[] | null }).data ?? [], depts: depts ?? [] });
}

export async function PATCH(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const { id, department, status, priority } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (department !== undefined) payload.department = department;
  if (status !== undefined) payload.status = status;
  if (priority !== undefined) payload.priority = priority;

  const { error: dbErr } = await supabase!.from("support_tickets").update(payload).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const body = await req.json();
  const { subject, body: message, priority, department, status, attachments, tenant_id, user_id, guest_name, guest_email } = body;

  if (!subject?.trim() || !message?.trim())
    return NextResponse.json({ error: "Subject and message required" }, { status: 400 });

  const validPriorities = ["low", "normal", "high", "urgent"];
  const validStatuses = ["open", "in_progress", "waiting", "resolved", "closed"];

  const payload: Record<string, unknown> = {
    subject: subject.trim(),
    body: message.trim(),
    priority: validPriorities.includes(priority) ? priority : "normal",
    status: validStatuses.includes(status) ? status : "open",
    department: department ?? "general",
    source: "site_admin",
  };

  if (attachments?.length) payload.attachments = attachments;
  if (tenant_id) payload.tenant_id = tenant_id;
  if (user_id) payload.user_id = user_id;
  if (guest_name) payload.guest_name = guest_name;
  if (guest_email) payload.guest_email = guest_email;

  const { data, error: dbErr } = await supabase!
    .from("support_tickets")
    .insert(payload)
    .select("id")
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
