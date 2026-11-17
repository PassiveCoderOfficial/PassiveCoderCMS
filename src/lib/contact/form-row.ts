import type { SupabaseClient } from "@supabase/supabase-js";

/** The contact_forms row submissions hang off (form_id is NOT NULL). One row
 *  per tenant + form name, created on first submit. */
export async function formRow(admin: SupabaseClient, tenantId: string, name: string) {
  const { data: found } = await admin
    .from("contact_forms").select("id, recipient_email")
    .eq("tenant_id", tenantId).eq("name", name).limit(1).maybeSingle();
  if (found) return found as { id: string; recipient_email: string | null };
  const { data: made } = await admin
    .from("contact_forms").insert({ tenant_id: tenantId, name }).select("id, recipient_email").single();
  return (made ?? null) as { id: string; recipient_email: string | null } | null;
}
