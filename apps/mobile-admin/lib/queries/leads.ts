// Leads (CRM contacts) — tenant-scoped direct Supabase reads, mirrors the
// pattern in lib/queries/pages.ts. RLS scopes rows to tenants the caller
// belongs to; tenant_id filters here are defense in depth, same rationale
// as pages.ts.

import { supabase } from "../supabase";

export interface LeadListItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  stage_id: string | null;
  last_activity_at: string | null;
}

// Loosely typed — this app only ever displays contact fields verbatim, never
// interprets them, so a full generated-schema type isn't worth maintaining.
export type Lead = Record<string, unknown> & {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage_id: string | null;
};

export interface ContactEvent {
  id: string;
  tenant_id: string;
  contact_id: string;
  type: string;
  title: string | null;
  body: string | null;
  meta: Record<string, unknown> | null;
  actor_user_id: string | null;
  created_at: string;
}

export interface CrmStage {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

export async function listLeads(tenantId: string): Promise<LeadListItem[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, company, source, stage_id, last_activity_at")
    .eq("tenant_id", tenantId)
    .order("last_activity_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadListItem[];
}

export async function getLead(contactId: string): Promise<Lead> {
  const { data, error } = await supabase.from("contacts").select("*").eq("id", contactId).single();
  if (error) throw error;
  return data as Lead;
}

export async function listLeadEvents(contactId: string): Promise<ContactEvent[]> {
  const { data, error } = await supabase
    .from("contact_events")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactEvent[];
}

export async function addLeadNote(contactId: string, tenantId: string, body: string): Promise<void> {
  const { error } = await supabase.from("contact_events").insert({
    tenant_id: tenantId,
    contact_id: contactId,
    type: "note",
    title: "Note",
    body,
  });
  if (error) throw error;
}

/**
 * Updates the contact's stage AND writes a timeline entry — mirroring the
 * exact shape src/app/api/crm/contacts/[id]/route.ts's PATCH handler writes
 * on a stage change (title "Stage → {name}", meta {from_stage, to_stage},
 * actor_user_id from the current session).
 */
export async function updateLeadStage(contactId: string, tenantId: string, stageId: string | null): Promise<void> {
  const { data: prev, error: prevErr } = await supabase
    .from("contacts")
    .select("stage_id")
    .eq("id", contactId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (prevErr) throw prevErr;

  const { error: updateErr } = await supabase
    .from("contacts")
    .update({ stage_id: stageId, updated_at: new Date().toISOString() })
    .eq("id", contactId)
    .eq("tenant_id", tenantId);
  if (updateErr) throw updateErr;

  if (prev && prev.stage_id !== stageId) {
    let newStageName: string | null = null;
    if (stageId) {
      const { data: newStage } = await supabase.from("crm_stages").select("name").eq("id", stageId).maybeSingle();
      newStageName = newStage?.name ?? null;
    }
    const { data: userData } = await supabase.auth.getUser();

    const { error: eventErr } = await supabase.from("contact_events").insert({
      tenant_id: tenantId,
      contact_id: contactId,
      type: "stage_change",
      title: `Stage → ${newStageName ?? "None"}`,
      meta: { from_stage: prev.stage_id, to_stage: stageId },
      actor_user_id: userData.user?.id ?? null,
    });
    if (eventErr) throw eventErr;
  }
}

export async function listStages(tenantId: string): Promise<CrmStage[]> {
  const { data, error } = await supabase
    .from("crm_stages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CrmStage[];
}
