import { createAdminClient } from "@/lib/supabase/server";
import { Globe, CreditCard, TicketIcon, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  function statusVariant(status: string) {
    if (status === "active") return "success" as const;
    if (status === "onboarded") return "info" as const;
    return "secondary" as const;
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-400" /> Platform Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-1">All systems and metrics across Passive Coder.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-foreground/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="text-3xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent sites */}
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-4">
          <CardTitle className="text-sm">Recent Sites</CardTitle>
          <Link href="/super-admin/sites" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Site</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Slug</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(recentSites ?? []).map(site => (
                <tr key={site.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{site.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{site.slug}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant(site.status)}>{site.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </CardContent>
      </Card>
    </div>
  );
}
