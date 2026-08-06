import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/server";
import StaffSidebar from "@/components/staff/sidebar";
import { Mail } from "lucide-react";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireStaff();
  if (!agent) redirect("/login");
  if (agent.status === "suspended") redirect("/login?error=staff_suspended");

  if (agent.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold">Account pending</h1>
          <p className="text-muted-foreground">
            Your staff account is pending approval. Contact a platform admin to activate it.
          </p>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium">{agent.email}</span>
          </p>
        </div>
      </div>
    );
  }

  // Fetch all sites this staff member is assigned to or referred
  const supabase = await createAdminClient();
  const [{ data: assigned }, { data: referred }] = await Promise.all([
    supabase.from("tenants").select("id,name,slug").eq("assigned_staff_id", agent.id).order("created_at", { ascending: true }),
    supabase.from("tenants").select("id,name,slug").eq("referred_by_staff_id", agent.id).order("created_at", { ascending: true }),
  ]);

  // Merge, deduplicate by id
  const seen = new Set<string>();
  const staffSites: { id: string; name: string; slug: string }[] = [];
  for (const s of [...(assigned ?? []), ...(referred ?? [])]) {
    if (!seen.has(s.id)) { seen.add(s.id); staffSites.push(s); }
  }

  return (
    <div className="flex h-screen bg-background">
      <StaffSidebar agent={agent} sites={staffSites} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
