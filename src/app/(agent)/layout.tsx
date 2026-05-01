import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/agent";
import AgentSidebar from "@/components/agent/sidebar";
import { Mail } from "lucide-react";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireAgent();
  if (!agent) redirect("/become-agent");
  if (agent.status === "suspended") redirect("/login?error=agent_suspended");

  if (agent.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            Your agent account is pending. Confirm your email address to activate it, or wait for a platform admin to approve you.
          </p>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium">{agent.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AgentSidebar agent={agent} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
