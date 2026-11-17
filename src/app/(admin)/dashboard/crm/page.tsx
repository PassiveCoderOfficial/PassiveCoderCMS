import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import CrmClient from "./crm-client";

export const metadata = { title: "CRM — Dashboard" };

const DEFAULT_STAGES = [
  { name: "New", color: "#6366f1", position: 0 },
  { name: "Contacted", color: "#f59e0b", position: 1 },
  { name: "Qualified", color: "#06b6d4", position: 2 },
  { name: "Won", color: "#22c55e", position: 3, is_won: true },
  { name: "Lost", color: "#ef4444", position: 4, is_lost: true },
];

export default async function CrmPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  let { data: stages } = await supabase
    .from("crm_stages").select("*").eq("tenant_id", tid).order("position");

  if (!stages?.length) {
    const admin = await createAdminClient();
    await admin.from("crm_stages")
      .insert(DEFAULT_STAGES.map((s) => ({ ...s, tenant_id: tid })));
    const { data: seeded } = await supabase
      .from("crm_stages").select("*").eq("tenant_id", tid).order("position");
    stages = seeded;
  }

  const [{ data: contacts, count }, { data: tasks }] = await Promise.all([
    supabase.from("contacts")
      .select("*, crm_stages(id, name, color)", { count: "exact" })
      .eq("tenant_id", tid)
      .order("last_activity_at", { ascending: false })
      .range(0, 24),
    supabase.from("crm_tasks")
      .select("*, contacts(id, first_name, last_name, email, phone, whatsapp)")
      .eq("tenant_id", tid).eq("status", "open")
      .order("due_at").limit(200),
  ]);

  return (
    <CrmClient
      initialStages={stages ?? []}
      initialContacts={contacts ?? []}
      initialTotal={count ?? 0}
      initialTasks={tasks ?? []}
    />
  );
}
