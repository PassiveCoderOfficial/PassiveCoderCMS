import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/agent";
import AgentSidebar from "@/components/agent/sidebar";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireAgent();
  if (!agent) redirect("/become-agent");
  if (agent.status === "suspended") redirect("/login?error=agent_suspended");

  return (
    <div className="flex h-screen bg-background">
      <AgentSidebar agent={agent} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
