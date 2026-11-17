import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { getSiteCurrency, formatMoney } from "@/lib/currency/currency-server";
import { fmtDateTime, normalizeTimeZone } from "@/lib/time/panel-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderActions } from "./order-actions";

type Item = { id?: string; name: string; image?: string | null; price: number; quantity: number; variant?: string | null; sku?: string | null };
// Two shapes reach this page: marketplace checkout saves { name, address,
// area, city }; the single-vendor checkout saves { first_name, last_name,
// address_line1, address_line2, city, state, postal_code, country }. Read both,
// otherwise single-vendor orders showed only the city — no street or country.
type Address = {
  name?: string | null; phone?: string | null; email?: string | null; address?: string | null; area?: string | null; city?: string | null; note?: string | null;
  first_name?: string | null; last_name?: string | null; address_line1?: string | null; address_line2?: string | null;
  state?: string | null; postal_code?: string | null; country?: string | null;
};

function AddressBlock({ a }: { a: Address | null }) {
  if (!a) return <p className="text-sm text-muted-foreground">Not provided</p>;
  const name = a.name || [a.first_name, a.last_name].filter(Boolean).join(" ");
  const street = a.address || [a.address_line1, a.address_line2].filter(Boolean).join(", ");
  const place = [a.area, a.city, a.state && a.state !== a.city ? a.state : null, a.postal_code].filter(Boolean).join(", ");
  return (
    <div className="text-sm space-y-0.5">
      {name && <p className="font-medium">{name}</p>}
      {street && <p>{street}</p>}
      {place && <p>{place}</p>}
      {a.country && <p>{a.country}</p>}
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
  const siteTz = normalizeTimeZone((await supabase.from("site_settings").select("timezone").eq("tenant_id", tenantId).maybeSingle()).data?.timezone ?? "UTC");
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
      {order.flagged_reason && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 print:hidden">
          <strong>Check this order.</strong> {order.flagged_reason}
        </div>
      )}
      <p className="hidden print:block text-xl font-bold">Packing slip · Order #{order.order_number}</p>
      <p className="text-sm text-muted-foreground -mt-4">
        Placed {fmtDateTime(order.created_at, siteTz)} · {order.fulfillment_type ? String(order.fulfillment_type).replace("_", " ") : "delivery"} · paid by {order.payment_method ?? "—"}
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

          {order.payment_proof && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Bank transfer details from customer</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1.5">
                {order.payment_proof.transaction_id && <p><span className="text-muted-foreground">Transaction ID:</span> <span className="font-medium">{order.payment_proof.transaction_id}</span></p>}
                {order.payment_proof.bank && <p><span className="text-muted-foreground">Paid from:</span> {order.payment_proof.bank}</p>}
                {order.payment_proof.note && <p className="whitespace-pre-wrap"><span className="text-muted-foreground">Note:</span> {order.payment_proof.note}</p>}
                {order.payment_proof.file_url && (
                  /\.pdf$/i.test(order.payment_proof.file_url)
                    ? <a href={order.payment_proof.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open transfer receipt (PDF)</a>
                    : <a href={order.payment_proof.file_url} target="_blank" rel="noopener noreferrer" className="block w-fit">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={order.payment_proof.file_url} alt="Transfer receipt" className="max-h-72 rounded border" />
                      </a>
                )}
                <p className="text-xs text-muted-foreground pt-1">Check the amount arrived in your bank, then set Payment to Paid.</p>
              </CardContent>
            </Card>
          )}

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
