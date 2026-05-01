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
