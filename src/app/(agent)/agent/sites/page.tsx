import { requireAgent } from "@/lib/agent";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExternalLink, Globe, Plus, Zap, Users } from "lucide-react";
import Link from "next/link";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const isLocal = ROOT.includes("localhost");
const proto = isLocal ? "http" : "https";

function siteUrl(slug: string) { return `${proto}://${slug}.${ROOT}`; }

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active"    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
    status === "onboarded" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
    "bg-gray-100 text-gray-500 dark:bg-gray-800";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

export default async function AgentSitesPage() {
  const agent = await requireAgent();
  if (!agent) redirect("/become-agent");

  const supabase = await createAdminClient();

  const [{ data: referred }, { data: assigned }] = await Promise.all([
    supabase.from("tenants")
      .select("id,name,slug,status,plan,created_at,onboarding_completed")
      .eq("referred_by_agent_id", agent.id)
      .order("created_at", { ascending: false }),
    supabase.from("tenants")
      .select("id,name,slug,status,plan,created_at,onboarding_completed")
      .eq("assigned_agent_id", agent.id)
      .order("created_at", { ascending: false }),
  ]);

  // Merge: assigned sites first, then referred (deduplicate by id)
  const assignedIds = new Set((assigned ?? []).map(s => s.id));
  const mergedReferred = (referred ?? []).filter(s => !assignedIds.has(s.id));

  function SiteTable({ sites, emptyMsg }: { sites: typeof referred; emptyMsg: string }) {
    if (!sites?.length) {
      return <p className="text-sm text-muted-foreground px-5 py-8 text-center">{emptyMsg}</p>;
    }
    return (
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
              <td className="px-5 py-3"><StatusBadge status={site.status} /></td>
              <td className="px-5 py-3 text-xs">{site.onboarding_completed ? "Yes" : "No"}</td>
              <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
              <td className="px-5 py-3">
                <a href={siteUrl(site.slug)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> Visit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Sites</h1>
          <p className="text-muted-foreground text-sm mt-1">Sites assigned to you or referred through your link.</p>
        </div>
        <Link href="/agent/sites/new"
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Site
        </Link>
      </div>

      {/* Assigned by SA */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h2 className="font-semibold text-sm">Assigned Sites</h2>
          <span className="text-xs text-muted-foreground">({assigned?.length ?? 0})</span>
        </div>
        <SiteTable sites={assigned} emptyMsg="No sites assigned by admin yet." />
      </div>

      {/* Referred */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-sm">Referred Sites</h2>
          <span className="text-xs text-muted-foreground">({mergedReferred.length})</span>
        </div>
        <SiteTable sites={mergedReferred} emptyMsg="No sites referred yet. Share your referral link." />
      </div>
    </div>
  );
}
