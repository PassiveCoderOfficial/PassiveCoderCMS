import { createAdminClient } from "@/lib/supabase/server";
import { Globe, CreditCard, TicketIcon, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Super Admin — Overview" };

export default async function SuperAdminOverview() {
  const supabase = await createAdminClient();

  const [
    { count: totalSites },
    { count: activeSubs },
    { count: openTickets },
    { count: totalUsers },
    { data: recentSites },
  ] = await Promise.all([
    supabase.from("tenants").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("super_admins").select("*", { count: "exact", head: true }),
    supabase.from("tenants").select("id,name,slug,status,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Total Sites", value: totalSites ?? 0, icon: Globe, href: "/super-admin/sites", color: "text-blue-400" },
    { label: "Active Subscriptions", value: activeSubs ?? 0, icon: CreditCard, href: "/super-admin/subscriptions", color: "text-green-400" },
    { label: "Open Tickets", value: openTickets ?? 0, icon: TicketIcon, href: "/super-admin/tickets", color: "text-amber-400" },
    { label: "Super Admins", value: totalUsers ?? 0, icon: Users, href: "/super-admin/users", color: "text-purple-400" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-400" /> Platform Overview
        </h1>
        <p className="text-gray-500 text-sm mt-1">All systems and metrics across Passive Coder.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
          </Link>
        ))}
      </div>

      {/* Recent sites */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white text-sm">Recent Sites</h2>
          <Link href="/super-admin/sites" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Site</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Slug</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {(recentSites ?? []).map(site => (
              <tr key={site.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3 text-white font-medium">{site.name}</td>
                <td className="px-5 py-3 text-gray-400">{site.slug}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    site.status === "active" ? "bg-green-900/50 text-green-400" :
                    site.status === "trial" ? "bg-amber-900/50 text-amber-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{site.status}</span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
