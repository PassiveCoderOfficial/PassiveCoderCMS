import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ShoppingBag, Users, TrendingUp, Package, AlertCircle, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  // Check if this user has a Pro sub from ENM but hasn't set up their site yet
  const { data: { user } } = await supabase.auth.getUser();
  let showProSiteBanner = false;
  if (user) {
    const admin = await createAdminClient();
    const { data: pendingTenant } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "enm_pending")
      .maybeSingle();
    showProSiteBanner = !!pendingTenant;
  }

  const [
    { count: pageCount },
    { count: postCount },
    { count: orderCount },
    { count: productCount },
    { count: userCount },
    { data: recentOrders },
    { data: recentTransactions },
  ] = await Promise.all([
    supabase.from("pages").select("*", { count: "exact", head: true }).eq("type", "page").eq("tenant_id", tenantId),
    supabase.from("pages").select("*", { count: "exact", head: true }).eq("type", "post").eq("tenant_id", tenantId),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("tenant_members").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("orders").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(5),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Total Pages", value: pageCount ?? 0, icon: FileText, href: "/dashboard/pages", color: "text-blue-600" },
    { label: "Blog Posts", value: postCount ?? 0, icon: FileText, href: "/dashboard/posts", color: "text-purple-600" },
    { label: "Products", value: productCount ?? 0, icon: Package, href: "/dashboard/ecommerce/products", color: "text-orange-600" },
    { label: "Orders", value: orderCount ?? 0, icon: ShoppingBag, href: "/dashboard/ecommerce/orders", color: "text-green-600" },
    { label: "Users", value: userCount ?? 0, icon: Users, href: "/dashboard/users", color: "text-pink-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      {showProSiteBanner && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-700 dark:text-red-400">Your Pro site is not set up yet</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
              You have an active Pro subscription from ExpertNear.Me. Complete your site setup to go live — choose a site name, subdomain, and template.
            </p>
          </div>
          <Link href="/onboarding">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0 shrink-0 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Create Your Pro Site
            </Button>
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back to your CMS</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/pages/new">New Page</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/posts/new">New Post</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/dashboard/ecommerce/orders">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentOrders?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        order.status === "completed" ? "bg-green-100 text-green-700" :
                        order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/dashboard/accounting/transactions">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentTransactions?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.type} · {tx.date}</p>
                    </div>
                    <p className={`font-semibold ${tx.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                      {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "New Page", href: "/dashboard/pages/new" },
              { label: "New Post", href: "/dashboard/posts/new" },
              { label: "Add Product", href: "/dashboard/ecommerce/products/new" },
              { label: "Upload Media", href: "/dashboard/media" },
              { label: "Manage Themes", href: "/dashboard/themes" },
              { label: "Manage Modules", href: "/dashboard/modules" },
              { label: "Site Settings", href: "/dashboard/settings" },
            ].map((action) => (
              <Button key={action.href} asChild variant="outline" size="sm">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
