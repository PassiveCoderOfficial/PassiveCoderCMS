import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/**
 * Send reminder emails for due CRM follow-up tasks.
 * Vercel Cron → GET with Authorization: Bearer CRON_SECRET;
 * manual → POST with x-cron-secret: INTERNAL_CRON_SECRET.
 * Each due open task (remind_via != none, not yet reminded) emails its
 * assignee — falling back to the tenant owner — with the contact's details
 * and a wa.me deep link so the follow-up is one tap away.
 */
async function handle(authorized: boolean) {
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("crm_tasks")
    .select("id, tenant_id, title, due_at, assignee_user_id, contacts(id, first_name, last_name, email, phone, whatsapp)")
    .eq("status", "open")
    .neq("remind_via", "none")
    .is("reminded_at", null)
    .lte("due_at", now)
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const task of due ?? []) {
    // Resolve recipient: assignee's email, else tenant owner's email
    let recipient: string | null = null;
    if (task.assignee_user_id) {
      const { data: profile } = await supabase
        .from("profiles").select("email").eq("id", task.assignee_user_id).maybeSingle();
      recipient = profile?.email ?? null;
    }
    if (!recipient) {
      const { data: tenant } = await supabase
        .from("tenants").select("owner_id").eq("id", task.tenant_id).maybeSingle();
      if (tenant?.owner_id) {
        const { data: owner } = await supabase
          .from("profiles").select("email").eq("id", tenant.owner_id).maybeSingle();
        recipient = owner?.email ?? null;
      }
    }

    if (recipient) {
      const c = (Array.isArray(task.contacts) ? task.contacts[0] : task.contacts) as
        | { first_name: string | null; last_name: string | null; email: string | null; phone: string | null; whatsapp: string | null }
        | null;
      const name = c ? [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.phone || "a contact" : "a contact";
      const wa = c?.whatsapp || c?.phone;
      const lines = [
        `Follow-up due: ${task.title}`,
        `Contact: ${name}`,
        c?.phone ? `Phone: ${c.phone}` : null,
        c?.email ? `Email: ${c.email}` : null,
        wa ? `WhatsApp: https://wa.me/${wa.replace(/\D/g, "")}` : null,
      ].filter(Boolean).join("\n");

      const result = await sendEmail({
        to: recipient,
        subject: `Follow-up due: ${task.title}`,
        text: lines,
      });
      if (result.ok) sent++;
    }

    // Mark reminded even without a recipient so we don't retry forever
    await supabase.from("crm_tasks").update({ reminded_at: now }).eq("id", task.id);
  }

  return NextResponse.json({ due: due?.length ?? 0, sent });
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const ok = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  return handle(ok);
}

export async function POST(req: Request) {
  const ok = req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  return handle(ok);
}
