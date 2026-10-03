import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { getSiteCurrency, formatMoney } from "@/lib/currency/currency-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderActions } from "./order-actions";

type Item = { id?: string; name: string; image?: string | null; price: number; quantity: number; variant?: string | null; sku?: string | null };
type Address = { name?: string | null; phone?: string | null; email?: string | null; address?: string | null; area?: string | null; city?: string | null; note?: string | null };

function AddressBlock({ a }: { a: Address | null }) {
  if (!a) return <p className="text-sm text-muted-foreground">Not provided</p>;
  return (
    <div className="text-sm space-y-0.5">
      {a.name && <p className="font-medium">{a.name}</p>}
      {a.address && <p>{a.address}</p>}
      {(a.area || a.city) && <p>{[a.area, a.city].filter(Boolean).join(", ")}</p>}
      {a.phone && <p><a href={`tel:${a.phone}`} className="text-primary hover:underline">{a.phone}</a></p>}
      {a.email && <p><a href={`mailto:${a.email}`} className="text-primary hover:underline">{a.email}</a></p>}
      {a.note && <p className="text-muted-foreground italic">“{a.note}”</p>}
    </div>
  );
}

/**
 * Order detail: what was bought, where it goes, how it was paid, and the
 * controls to move it through fulfilment (status, payment, notes, customer
 * email, printable packing slip). The orders list linked here for months but
 * the page didn't exist.
 */
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!order) notFound();
  const cur = await getSiteCurrency(tenantId);
  const money = (n: number | null | undefined) => formatMoney(Number(n ?? 0), cur);
  const items = (Array.isArray(order.items) ? order.items : []) as Item[];
  const ship = order.shipping_address as Address | null;
  const bill = order.billing_address as Address | null;
  const sameAddress = JSON.stringify(ship) === JSON.stringify(bill);
  const whatsapp = (ship?.phone ?? bill?.phone ?? "").replace(/[^\d]/g, "");

  return (
    <div className="order-print-root p-6 max-w-5xl space-y-6 print:p-0">
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/dashboard/ecommerce/orders" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
      </div>
      <p className="hidden print:block text-xl font-bold">Packing slip · Order #{order.order_number}</p>
      <p className="text-sm text-muted-foreground -mt-4">
        Placed {new Date(order.created_at).toLocaleString()} · {order.fulfillment_type ? String(order.fulfillment_type).replace("_", " ") : "delivery"} · paid by {order.payment_method ?? "—"}
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Items ({items.reduce((n, i) => n + Number(i.quantity ?? 0), 0)})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {items.map((i, k) => (
                    <tr key={k}>
                      <td className="px-4 py-3 w-14 print:hidden">
                        {i.image ? <img src={i.image} alt="" className="w-12 h-12 rounded object-cover bg-muted" /> : <div className="w-12 h-12 rounded bg-muted" />}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{i.name}</p>
                        {(i.variant || i.sku) && <p className="text-xs text-muted-foreground">{[i.variant, i.sku && `SKU ${i.sku}`].filter(Boolean).join(" · ")}</p>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">{money(i.price)} × {i.quantity}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{money(Number(i.price) * Number(i.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(order.subtotal)}</span></div>
                {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount{order.voucher_codes?.length ? ` (${order.voucher_codes.join(", ")})` : ""}</span><span>−{money(order.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{money(order.shipping_cost)}</span></div>
                {Number(order.tax) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{money(order.tax)}</span></div>}
                <div className="flex justify-between font-semibold text-base pt-1 border-t"><span>Total</span><span>{money(order.total)}</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">{sameAddress ? "Customer & delivery" : "Delivery address"}</CardTitle></CardHeader>
              <CardContent><AddressBlock a={ship ?? bill} /></CardContent>
            </Card>
            {!sameAddress && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Billing address</CardTitle></CardHeader>
                <CardContent><AddressBlock a={bill} /></CardContent>
              </Card>
            )}
            <Card className="print:hidden">
              <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{order.customer_name ?? "—"}</p>
                {order.customer_email && <p><a className="text-primary hover:underline" href={`mailto:${order.customer_email}`}>{order.customer_email}</a></p>}
                {whatsapp && <p><a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, about your order #${order.order_number}`)}`}>Message on WhatsApp</a></p>}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="print:hidden">
          <OrderActions
            orderId={order.id}
            status={order.status}
            paymentStatus={order.payment_status}
            notes={order.notes ?? ""}
            hasEmail={!!order.customer_email && !String(order.customer_email).endsWith("@nomail.local")}
            transactionId={order.transaction_id}
          />
        </div>
      </div>
    </div>
  );
}
