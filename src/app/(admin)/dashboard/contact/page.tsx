import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import ContactClient from "./contact-client";

export const metadata = { title: "Contact — Dashboard" };

export default async function ContactPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const [{ data: details }, { data: forms }, { data: submissions }] = await Promise.all([
    supabase.from("contact_details").select("*").eq("tenant_id", tid).order("sort_order"),
    supabase.from("contact_forms").select("*").eq("tenant_id", tid),
    supabase.from("contact_form_submissions").select("id,form_id,data,ip,read,created_at").eq("tenant_id", tid).order("created_at", { ascending: false }).limit(100),
  ]);

  return <ContactClient initialDetails={details ?? []} initialForms={forms ?? []} initialSubmissions={submissions ?? []} />;
}
