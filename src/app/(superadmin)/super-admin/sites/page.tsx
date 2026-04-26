import { createAdminClient } from "@/lib/supabase/server";
import { Globe, ExternalLink, Search } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "All Sites — Super Admin" };

export default async function AllSitesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const supabase = await createAdminClient();

  let query = supabase
    .from("tenants")
    .select("id,name,slug,status,custom_domain,domain_status,created_at,onboarding_completed")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  if (status) query = query.eq("status", status);

  const { data: sites } = await query.limit(50);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-400" /> All Sites
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <form className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or slug…"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
        {["", "trial", "active", "suspended"].map(s => (
          <Link
            key={s}
            href={s ? `/super-admin/sites?status=${s}` : "/super-admin/sites"}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              (status ?? "") === s
                ? "bg-indigo-600 text-white"
                : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {["Site", "Slug / Domain", "Status", "Onboarded", "Created", ""].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(sites ?? []).map(site => (
              <tr key={site.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3 text-white font-medium">{site.name}</td>
                <td className="px-5 py-3">
                  <div className="text-gray-300">{site.slug}</div>
                  {site.custom_domain && <div className="text-xs text-indigo-400">{site.custom_domain}</div>}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    site.status === "active" ? "bg-green-900/50 text-green-400" :
                    site.status === "trial" ? "bg-amber-900/50 text-amber-400" :
                    site.status === "suspended" ? "bg-red-900/50 text-red-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{site.status}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs ${site.onboarding_completed ? "text-green-400" : "text-gray-500"}`}>
                    {site.onboarding_completed ? "Yes" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <Link
                    href={`/super-admin/sites/${site.id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Manage <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {!sites?.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-600">No sites found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
