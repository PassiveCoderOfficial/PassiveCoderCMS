import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FileDown, PackageOpen, Truck } from "lucide-react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
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

  // Seller parcels of these orders (ids came from the RLS-scoped read above).
  type Parcel = { id: string; order_id: string; status: string; courier: string | null; tracking_number: string | null; courier_tracking_url: string | null; vendors: { name: string } | null };
  const parcels = new Map<string, Parcel[]>();
  if (rows.length) {
    const admin = await createAdminClient();
    const { data: subs } = await admin.from("sub_orders")
      .select("id, order_id, status, courier, tracking_number, courier_tracking_url, vendors(name)")
      .eq("tenant_id", tenantId).in("order_id", rows.map((r) => r.id)).order("created_at");
    for (const sub of (subs ?? []) as unknown as Parcel[]) parcels.set(sub.order_id, [...(parcels.get(sub.order_id) ?? []), sub]);
  }

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
              <div key={order.id} className="relative rounded-2xl bg-card border p-4 hover:border-primary transition-colors">
                {/* Whole card opens the order; the invoice link sits above it. */}
                <Link href={`/order-confirmation/${order.id}`} className="absolute inset-0 rounded-2xl" aria-label={`Order ${order.order_number ?? ""}`} />
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
                {(parcels.get(order.id) ?? []).length > 0 && (
                  <ul className="relative z-10 mt-3 space-y-1.5">
                    {parcels.get(order.id)!.map((sp) => (
                      <li key={sp.id} className="flex flex-wrap items-center gap-2 text-xs rounded-lg bg-muted/50 px-3 py-2">
                        <Truck className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">{sp.vendors?.name ?? "Seller"}</span>
                        <span className={`uppercase tracking-wide font-semibold rounded-full px-1.5 py-0.5 text-[10px] ${STATUS_STYLE[sp.status] ?? "bg-muted text-muted-foreground"}`}>
                          {sp.status === "shipped" ? "on the way" : sp.status}
                        </span>
                        {sp.courier && <span className="text-muted-foreground">{sp.courier}{sp.tracking_number ? ` · ${sp.tracking_number}` : ""}</span>}
                        <span className="ml-auto flex gap-3">
                          {sp.courier_tracking_url && (
                            <a href={sp.courier_tracking_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Courier site</a>
                          )}
                          <Link href={`/track?id=${order.id}`} className="font-semibold text-primary hover:underline">Track</Link>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 pt-3 border-t flex justify-end">
                  <a href={`/api/storefront/orders/${order.id}/invoice`} className="relative z-10 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <FileDown className="w-3.5 h-3.5" /> Download invoice
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
