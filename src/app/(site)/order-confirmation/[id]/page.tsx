import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, Package, ArrowLeft, Store, Truck, Banknote } from "lucide-react";
import type { CartItem } from "@/types/cms";
import { OrderSummary } from "./order-summary";

/** Marketplace checkout stores a Bangladesh-shaped address (single address
 *  line plus an area) rather than the Western first/last-name, postal-code
 *  shape of the shared `Address` type. Fields are optional because older
 *  single-vendor orders were written in that other shape. */
interface DeliveryAddress {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  city?: string;
  note?: string;
  address_line1?: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

interface SubOrderRow {
  id: string;
  sub_order_number: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  vendors: { name: string; slug: string | null } | null;
}

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  // Read with the service role, then scope by tenant explicitly. Guest
  // checkout leaves no session, so a user-scoped read would be blocked by
  // RLS and every guest would land on a 404 right after paying. The order id
  // is an unguessable uuid handed straight back to the buyer.
  const supabase = await createAdminClient();
  let q = supabase.from("orders").select("*").eq("id", id);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data: order } = await q.maybeSingle();

  if (!order) notFound();

  const { data: subRows } = await supabase
    .from("sub_orders")
    .select("id, sub_order_number, status, items, subtotal, shipping_cost, total, vendors(name, slug)")
    .eq("order_id", id)
    .order("created_at");

  const subOrders = (subRows ?? []) as unknown as SubOrderRow[];
  const items = (order.items ?? []) as CartItem[];
  const billing = (order.billing_address ?? {}) as DeliveryAddress;
  const isCod = order.payment_method === "cod";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Order confirmed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isCod
            ? "Please keep the exact amount ready for the delivery person."
            : "Thank you for your purchase. Your order has been received."}
        </p>
        <div className="inline-flex items-center gap-2 mt-4 bg-muted/60 rounded-full px-4 py-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{order.order_number}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Multi-vendor orders ship as separate parcels, so the buyer is told
            up front rather than wondering why one box arrived without the
            rest of their basket. */}
        {subOrders.length > 1 && (
          <div className="border rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold">
                Arriving in {subOrders.length} separate parcels
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Each seller ships their own items. They may arrive on different days.
              </p>
            </div>
            {subOrders.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-muted-foreground" />
                    {s.vendors?.name ?? "Seller"}
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">
                    {s.sub_order_number}
                  </span>
                </div>
                <ul className="space-y-1">
                  {(s.items ?? []).map((it, i) => (
                    <li key={i} className="flex justify-between text-sm text-muted-foreground">
                      <span className="truncate pr-2">{it.name} × {it.quantity}</span>
                      <span className="shrink-0">{tk(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Delivery
                  </span>
                  <span>{s.shipping_cost === 0 ? "Free" : tk(s.shipping_cost)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <OrderSummary
          items={items}
          subtotal={Number(order.subtotal)}
          shipping_cost={Number(order.shipping_cost)}
          tax={Number(order.tax)}
          total={Number(order.total)}
        />

        {isCod && (
          <div className="border rounded-xl p-4 flex items-start gap-3">
            <Banknote className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Cash on delivery</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pay {tk(Number(order.total))} when your parcels arrive.
                {subOrders.length > 1 && " Each parcel is paid for separately on arrival."}
              </p>
            </div>
          </div>
        )}

        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Delivery address</h2>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="text-foreground">{order.customer_name}</p>
            {billing?.phone && <p>{billing.phone}</p>}
            {(billing.address || billing.address_line1) && (
              <p>
                {billing.address ?? billing.address_line1}
                {billing.area ? `, ${billing.area}` : ""}
                {!billing.area && billing.city ? `, ${billing.city}` : ""}
              </p>
            )}
            {billing?.note && <p className="italic">Note: {billing.note}</p>}
          </div>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>
      </div>
    </div>
  );
}
