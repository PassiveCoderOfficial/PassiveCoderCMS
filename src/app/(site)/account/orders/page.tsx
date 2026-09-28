import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrencyConfig, formatWithConfig } from "@/lib/ecommerce/currency-server";
import { AccountNav } from "../account-nav";

export const metadata = { title: "My Orders" };

type OrderRow = {
  id: string;
  order_number: string | null;
  status: string;
  payment_status: string;
  total: number;
  items: unknown;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-200 text-gray-700",
};

export default async function AccountOrdersPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/orders");

  // RLS (orders_customer_read_own, migration 083) already restricts this to
  // the signed-in customer's own rows — the tenant_id filter here is belt and
  // suspenders so a customer who has ordered from more than one tenant on
  // this platform only sees THIS store's orders on THIS store's page.
  const [{ data: orders }, currency] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, items, created_at")
      .eq("tenant_id", tenantId)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    getCurrencyConfig(tenantId),
  ]);

  const rows = (orders ?? []) as OrderRow[];

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <AccountNav />

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card border p-12 text-center">
          <PackageOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="mt-3 font-semibold">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">When you place an order it will show up here.</p>
          <Link href="/shop" className="inline-block mt-5 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((order) => {
            const items = (Array.isArray(order.items) ? order.items : []) as { name?: string; image?: string | null; quantity?: number }[];
            const thumbs = items.filter((i) => i.image).slice(0, 4);
            return (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.id}`}
                className="block rounded-2xl bg-card border p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">Order #{order.order_number ?? order.id.slice(0, 8)}</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${STATUS_STYLE[order.status] ?? "bg-muted text-muted-foreground"}`}>
                    {order.status}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex -space-x-2">
                    {thumbs.map((i, k) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={k} src={i.image!} alt="" className="w-12 h-12 rounded-lg object-cover border-2 border-card" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 flex-1">
                    {items.map((i) => i.name).filter(Boolean).join(", ") || `${items.length} item${items.length === 1 ? "" : "s"}`}
                  </p>
                  <span className="text-base font-bold text-primary whitespace-nowrap">{formatWithConfig(Number(order.total), currency)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
