import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/agent";
import { createAdminClient } from "@/lib/supabase/server";
import AgentSidebar from "@/components/agent/sidebar";
import { Mail } from "lucide-react";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireAgent();
  if (!agent) redirect("/login");
  if (agent.status === "suspended") redirect("/login?error=agent_suspended");

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

  // Fetch agent's primary site slug for "Switch to Site Admin" link
  const supabase = await createAdminClient();
  const { data: primarySite } = await supabase
    .from("tenants")
    .select("slug")
    .or(`assigned_agent_id.eq.${agent.id},referred_by_agent_id.eq.${agent.id}`)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
  const isLocal = ROOT.includes("localhost");
  const proto = isLocal ? "http" : "https";
  const dashboardUrl = primarySite?.slug
    ? `${proto}://${primarySite.slug}.${ROOT}/dashboard`
    : null;

  return (
    <div className="flex h-screen bg-background">
      <AgentSidebar agent={agent} dashboardUrl={dashboardUrl} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
