import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, Package, ArrowLeft } from "lucide-react";
import type { CartItem, Address } from "@/types/cms";
import { OrderSummary } from "./order-summary";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const supabase = await createClient();
  let q = supabase.from("orders").select("*").eq("id", id);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data: order } = await q.maybeSingle();

  if (!order) notFound();

  const items = (order.items ?? []) as CartItem[];
  const billing = order.billing_address as Address & { email?: string; phone?: string };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success banner */}
      <div className="text-center mb-10">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Thank you for your purchase. Your order has been received.
        </p>
        <div className="inline-flex items-center gap-2 mt-4 bg-muted/60 rounded-full px-4 py-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{order.order_number}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Items + totals (client for currency formatting) */}
        <OrderSummary
          items={items}
          subtotal={order.subtotal}
          shipping_cost={order.shipping_cost ?? 0}
          tax={order.tax ?? 0}
          total={order.total}
        />

        {/* Billing */}
        {billing && (
          <section className="border rounded-xl p-6 space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Billing Details</h2>
            <p className="text-sm font-medium">{billing.first_name} {billing.last_name}</p>
            {billing.email && <p className="text-sm text-muted-foreground">{billing.email}</p>}
            {billing.phone && <p className="text-sm text-muted-foreground">{billing.phone}</p>}
            <p className="text-sm text-muted-foreground">{billing.address_line1}{billing.address_line2 ? `, ${billing.address_line2}` : ""}</p>
            <p className="text-sm text-muted-foreground">{[billing.city, billing.state, billing.postal_code].filter(Boolean).join(", ")}</p>
            <p className="text-sm text-muted-foreground">{billing.country}</p>
          </section>
        )}

        {/* Payment */}
        <section className="border rounded-xl p-6">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Payment</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm capitalize">{order.payment_method?.replace(/_/g, " ") ?? "—"}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
              order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}>
              {order.payment_status}
            </span>
          </div>
          {order.payment_status === "pending" && order.payment_method === "manual" && (
            <p className="text-xs text-muted-foreground mt-2">
              Please complete your payment as per the instructions provided. Your order will be processed once payment is confirmed.
            </p>
          )}
        </section>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
