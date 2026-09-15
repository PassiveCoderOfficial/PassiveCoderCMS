// Support tickets — direct Supabase, RLS-scoped, same pattern as
// dashboard.ts/restaurant.ts. Mirrors cms/src/app/(admin)/dashboard/support
// exactly: tenants can create tickets + reply, never see internal notes
// (support_ticket_messages RLS has no carve-out granting a non-super-admin
// visibility into someone else's is_internal row — there just never are
// any is_internal=true rows a tenant owns, since the insert policy forces
// is_internal=false for non-super-admins).

import { supabase } from "../supabase";

export interface SupportTicket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  department: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  user_id: string | null;
  author_name: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface SupportDepartment { id: string; name: string; slug: string }

export async function getDepartments(): Promise<SupportDepartment[]> {
  const { data, error } = await supabase
    .from("support_departments")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getTickets(tenantId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, body, status, priority, department, attachments, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTicket(
  tenantId: string,
  userId: string,
  input: { subject: string; body: string; priority: string; department: string },
): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      tenant_id: tenantId, user_id: userId,
      subject: input.subject.trim(), body: input.body.trim(),
      priority: input.priority, department: input.department || "support",
      status: "open", attachments: [],
    })
    .select("id, subject, body, status, priority, department, attachments, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from("support_ticket_messages")
    .select("id, user_id, author_name, body, is_internal, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function sendReply(ticketId: string, userId: string, body: string): Promise<void> {
  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId, user_id: userId, body: body.trim(), is_internal: false,
  });
  if (error) throw error;
}

/** Reopens a resolved/closed ticket — a reply on a "done" ticket should
 *  surface back to support, not sit invisibly closed. Matches the web
 *  dashboard's exact same behavior. */
export async function reopenIfClosed(ticketId: string, currentStatus: string): Promise<boolean> {
  if (currentStatus !== "resolved" && currentStatus !== "closed") return false;
  const { error } = await supabase.from("support_tickets").update({ status: "open" }).eq("id", ticketId);
  if (error) throw error;
  return true;
}
