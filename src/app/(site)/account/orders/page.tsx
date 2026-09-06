import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "../account-nav";

export const metadata = { title: "My Orders" };

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  items: unknown;
  created_at: string;
};

export default async function AccountOrdersPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  // RLS (orders_customer_read_own, migration 083) already restricts this to
  // the signed-in customer's own rows — the tenant_id filter here is belt and
  // suspenders so a customer who has ordered from more than one tenant on
  // this platform only sees THIS store's orders on THIS store's page.
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, payment_status, total, items, created_at")
    .eq("tenant_id", tenantId)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (orders ?? []) as OrderRow[];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <AccountNav />
      <h1 className="text-xl font-semibold mb-6">My Orders</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((order) => {
            const itemCount = Array.isArray(order.items) ? order.items.length : 0;
            return (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.id}`}
                className="block rounded-lg border p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Order #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {itemCount} item{itemCount === 1 ? "" : "s"} · {order.status}
                  </span>
                  <span className="text-sm font-semibold">${Number(order.total).toFixed(2)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
