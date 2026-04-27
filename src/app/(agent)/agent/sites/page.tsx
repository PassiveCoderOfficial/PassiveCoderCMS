import { requireAgent } from "@/lib/agent";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExternalLink, Globe } from "lucide-react";

export default async function AgentSitesPage() {
  const agent = await requireAgent();
  if (!agent) redirect("/become-agent");

  const supabase = await createAdminClient();
  const { data: sites } = await supabase
    .from("tenants")
    .select("id,name,slug,status,plan,created_at,onboarding_completed")
    .eq("referred_by_agent_id", agent.id)
    .order("created_at", { ascending: false });

  const isLocal = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "").includes("localhost");
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">My Sites</h1>
        <p className="text-muted-foreground text-sm mt-1">All sites referred through your link.</p>
      </div>

      {!sites?.length ? (
        <div className="rounded-xl border bg-muted/30 p-12 text-center space-y-3">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-semibold">No sites yet</p>
          <p className="text-sm text-muted-foreground">Sites created via your referral link will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["Site Name", "Plan", "Status", "Onboarded", "Created", "Visit"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map(site => (
                <tr key={site.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{site.name}</td>
                  <td className="px-5 py-3 capitalize text-muted-foreground">{site.plan}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      site.status === "active" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                      site.status === "trial" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}>
                      {site.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs">{site.onboarding_completed ? "Yes" : "No"}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <a
                      href={`${isLocal ? "http" : "https"}://${site.slug}.${rootDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
