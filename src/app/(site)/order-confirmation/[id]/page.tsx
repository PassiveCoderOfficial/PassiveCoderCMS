import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, Package, ArrowLeft, Store, Truck, Banknote, UtensilsCrossed, ShoppingBag, MessageCircle, FileDown, CreditCard } from "lucide-react";
import type { CartItem } from "@/types/cms";
import { OrderSummary } from "./order-summary";
import { DeliveryTracker } from "./delivery-tracker";
import { ChatNowButton } from "@/modules/registry/marketplace/chat-now-button";
import { getCurrencyConfig, formatWithConfig } from "@/lib/ecommerce/currency-server";
import { getStorePaymentMethods } from "@/lib/ecommerce/payment-methods";

const STEPS = ["pending", "accepted", "packed", "shipped", "delivered"] as const;
const STEP_LABEL: Record<string, string> = { pending: "Placed", accepted: "Confirmed", packed: "Packed", shipped: "Shipped", delivered: "Delivered" };

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
  thana?: string;
  district?: string;
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
  vendor_id: string;
  courier: string | null;
  tracking_number: string | null;
  courier_tracking_url: string | null;
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
  let q = supabase.from("orders").select("*, restaurant_tables(table_number), restaurant_branches(name, address, phone)").eq("id", id);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data: order } = await q.maybeSingle();

  if (!order) notFound();

  const { data: subRows } = await supabase
    .from("sub_orders")
    .select("id, sub_order_number, status, items, subtotal, shipping_cost, total, vendor_id, courier, tracking_number, courier_tracking_url, vendors(name, slug)")
    .eq("order_id", id)
    .order("created_at");

  const subOrders = (subRows ?? []) as unknown as SubOrderRow[];
  const items = (order.items ?? []) as CartItem[];
  const billing = (order.billing_address ?? {}) as DeliveryAddress;
  const isCod = order.payment_method === "cod";
  // bKash / Nagad: repeat the number and the reported TrxID so the buyer can
  // pay (or check what they sent) after leaving the checkout.
  const isMobileMoney = order.payment_method === "bkash" || order.payment_method === "nagad";
  const isWhatsapp = order.payment_method === "whatsapp";
  const fulfillmentType = (order as { fulfillment_type?: string }).fulfillment_type ?? "delivery";
  const isDineIn = fulfillmentType === "dine_in";
  const isPickup = fulfillmentType === "pickup";
  const tableRel = (order as { restaurant_tables?: { table_number: string } | { table_number: string }[] | null }).restaurant_tables;
  const tableNumber = Array.isArray(tableRel) ? tableRel[0]?.table_number : tableRel?.table_number;
  const branchRel = (order as { restaurant_branches?: { name: string; address: string | null; phone: string | null } | { name: string; address: string | null; phone: string | null }[] | null }).restaurant_branches;
  const branch = Array.isArray(branchRel) ? branchRel[0] : branchRel;
  const pickupTime = (order as { pickup_time?: string | null }).pickup_time;

  // A single-store order (no seller parcels) is confirmed by the shop itself,
  // so the buyer gets the shop's own contact: the pickup address, and a
  // WhatsApp link pre-filled with the order number. Marketplace orders keep
  // their per-seller chat instead.
  const isSingleStore = subOrders.length === 0;
  const currencyCfg = await getCurrencyConfig(tenantId);
  const mobileMethod = isMobileMoney && tenantId
    ? (await getStorePaymentMethods(tenantId, currencyCfg.currency)).find((m) => m.slug === order.payment_method) ?? null
    : null;
  const proof = (order as { payment_proof?: { transaction_id?: string; bank?: string } | null }).payment_proof ?? null;
  // Marketplace orders keep their existing taka formatting (tk above).
  const money = (n: number) => (isSingleStore ? formatWithConfig(Number(n), currencyCfg) : tk(n));
  let shop: { address: string | null; phone: string | null; whatsapp: string | null } | null = null;
  let shopName: string | null = null;
  if (isSingleStore && tenantId && !isDineIn) {
    const [{ data: contact }, { data: identity }] = await Promise.all([
      supabase
        .from("contact_details")
        .select("address, phone, whatsapp")
        .eq("tenant_id", tenantId)
        .order("is_primary", { ascending: false })
        .order("sort_order")
        .limit(1)
        .maybeSingle(),
      supabase.from("site_identity").select("site_name").eq("tenant_id", tenantId).maybeSingle(),
    ]);
    shop = contact ?? null;
    shopName = identity?.site_name ?? null;
  }
  const waDigits = shop?.whatsapp?.replace(/\D/g, "") ?? "";
  const { data: langRow } = tenantId && fulfillmentType === "delivery"
    ? await supabase.from("site_settings").select("language").eq("tenant_id", tenantId).maybeSingle()
    : { data: null };
  const siteLang: "bn" | "en" = langRow?.language === "bn" ? "bn" : "en";
  // "Order on WhatsApp" orders are only real once the shop sees them, so the
  // message carries the full item list, not just the order number.
  const waText = isWhatsapp
    ? [
        `Hi${shopName ? ` ${shopName}` : ""}, I would like to order (ref ${order.order_number}):`,
        ...items.map((it) => `- ${it.quantity} x ${it.name} (${money(Number(it.price) * it.quantity)})`),
        `Total: ${money(Number(order.total))}`,
        billing.name ? `Name: ${billing.name}` : "",
        billing.phone ? `Phone: ${billing.phone}` : "",
      ].filter(Boolean).join("\n")
    : `Hi${shopName ? ` ${shopName}` : ""}, I placed order ${order.order_number} (${money(Number(order.total))}) on your website. Please confirm it.`;
  const waUrl = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}` : null;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
      <div className="text-center mb-6 rounded-2xl bg-card border p-6">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Order confirmed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isDineIn
            ? `Your order is on its way to Table ${tableNumber ?? ""}.`
            : isPickup
              ? branch
                ? "Your order has been sent to the kitchen — we'll have it ready for pickup."
                : "Your order has been received — we'll have it ready for pickup."
              : isCod
                ? "Please keep the exact amount ready for the delivery person."
                : "Thank you for your purchase. Your order has been received."}
        </p>
        <div className="inline-flex items-center gap-2 mt-4 bg-muted/60 rounded-full px-4 py-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{order.order_number}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Restaurant delivery: live status, rider on the way (food delivery phase 7). */}
        {fulfillmentType === "delivery" && (order as { branch_id?: string | null }).branch_id && (
          <DeliveryTracker orderId={order.id} lang={siteLang} />
        )}
        {/* Multi-vendor orders ship as separate parcels, so the buyer is told
            up front rather than wondering why one box arrived without the
            rest of their basket. */}
        {subOrders.length > 0 && (
          <div className="bg-card border rounded-2xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold">
                {subOrders.length > 1 ? `Arriving in ${subOrders.length} separate parcels` : "Your parcel"}
              </h2>
              {subOrders.length > 1 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Each seller ships their own items. They may arrive on different days.
                </p>
              )}
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
                {["cancelled", "returned"].includes(s.status) ? (
                  <p className="text-xs font-semibold text-red-600 uppercase">{s.status}</p>
                ) : (
                  <ol className="grid grid-cols-5 gap-1 pt-1">
                    {STEPS.map((st, k) => {
                      const done = STEPS.indexOf(s.status as (typeof STEPS)[number]) >= k;
                      return (
                        <li key={st} className="text-center">
                          <span className={`block h-1.5 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
                          <span className={`block mt-1 text-[10px] ${done ? "text-primary font-semibold" : "text-muted-foreground"}`}>{STEP_LABEL[st]}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {s.tracking_number && (
                  <p className="text-xs text-muted-foreground">
                    Tracking: <span className="font-mono text-foreground">{s.tracking_number}</span>
                    {s.courier ? ` (${s.courier})` : ""}
                    {s.courier_tracking_url && (
                      <a href={s.courier_tracking_url} target="_blank" rel="noopener noreferrer" className="ml-2 font-semibold text-primary hover:underline">
                        Open on {s.courier ?? "courier"} site
                      </a>
                    )}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/track?id=${order.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1.5 hover:border-primary hover:text-primary"
                  >
                    <Truck className="w-3.5 h-3.5" /> Track parcel
                  </Link>
                  <ChatNowButton
                    vendorId={s.vendor_id}
                    label="Chat with seller"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1.5 hover:border-primary hover:text-primary [&_svg]:w-3.5 [&_svg]:h-3.5"
                  />
                  {s.status === "delivered" &&
                    (s.items ?? []).slice(0, 3).map((it, i) => (
                      <Link
                        key={i}
                        href={`/products/${it.slug}?review=1#reviews`}
                        className="inline-flex items-center text-xs font-semibold bg-primary text-primary-foreground rounded-full px-3 py-1.5"
                      >
                        Rate {it.name.length > 18 ? `${it.name.slice(0, 18)}…` : it.name}
                      </Link>
                    ))}
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

        {waUrl && (
          <div className={`bg-card border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isWhatsapp ? "border-[#25D366] border-2" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{isWhatsapp ? "Send your order on WhatsApp" : "Confirm on WhatsApp"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isWhatsapp
                  ? "Your order is saved. Tap the button to send it to us. We confirm price, delivery and payment on WhatsApp."
                  : "Send us your order number for a faster confirmation."}
              </p>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 shrink-0"
            >
              <MessageCircle className="w-4 h-4" /> {isWhatsapp ? "Send order on WhatsApp" : "Confirm on WhatsApp"}
            </a>
          </div>
        )}

        {isMobileMoney && (
          <div className="bg-card border rounded-2xl p-4 flex items-start gap-3">
            <Banknote className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Pay {money(Number(order.total))} by {mobileMethod?.name ?? (order.payment_method === "bkash" ? "bKash" : "Nagad")}</p>
              {mobileMethod?.settings?.number
                ? <p className="mt-0.5">Send Money to <span className="font-mono font-semibold">{mobileMethod.settings.number}</span>{mobileMethod.settings.account_type ? ` (${mobileMethod.settings.account_type})` : ""} with reference {order.order_number}.</p>
                : <p className="mt-0.5 text-muted-foreground">We will send you the number on WhatsApp.</p>}
              {mobileMethod?.settings?.instructions && <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{mobileMethod.settings.instructions}</p>}
              {proof?.transaction_id
                ? <p className="mt-1 text-muted-foreground">Transaction ID you gave us: <span className="font-mono text-foreground">{proof.transaction_id}</span>{proof.bank ? ` from ${proof.bank}` : ""}. We confirm once it arrives.</p>
                : <p className="mt-1 text-muted-foreground">After paying, send us the Transaction ID (TrxID) on WhatsApp with your order number.</p>}
            </div>
          </div>
        )}

        {order.payment_method === "online" && (
          <div className="bg-card border rounded-2xl p-4 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              {order.payment_status === "paid" ? (
                <>
                  <p className="font-medium">Paid online</p>
                  <p className="text-muted-foreground mt-0.5">
                    {money(Number(order.total))} received{order.transaction_id ? <> · Transaction <span className="font-mono text-foreground">{order.transaction_id}</span></> : null}. Nothing to pay on delivery.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Payment not completed</p>
                  <p className="text-muted-foreground mt-0.5">We have saved your order. Pay now to send it to the seller.</p>
                  <a href={`/api/payments/sslcommerz/retry?order=${order.id}`} className="inline-flex mt-2 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 font-semibold">Pay {money(Number(order.total))}</a>
                </>
              )}
            </div>
          </div>
        )}

        {isCod && (
          <div className="bg-card border rounded-2xl p-4 flex items-start gap-3">
            <Banknote className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Cash on delivery</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isPickup
                  ? `Pay ${money(Number(order.total))} when you collect your order.`
                  : `Pay ${money(Number(order.total))} when your ${subOrders.length > 1 ? "parcels arrive" : "order arrives"}.`}
                {subOrders.length > 1 && " Each parcel is paid for separately on arrival."}
              </p>
            </div>
          </div>
        )}

        {isDineIn ? (
          <div className="bg-card border rounded-2xl p-4 flex items-start gap-3">
            <UtensilsCrossed className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{branch?.name ?? "Dine-in"} — Table {tableNumber ?? "—"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                No need to wait at the counter — it'll be brought straight to your table.
              </p>
            </div>
          </div>
        ) : isPickup ? (
          <div className="bg-card border rounded-2xl p-4 flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{branch?.name ?? (shopName ? `Pickup from ${shopName}` : "Pickup")}</p>
              {(branch?.address ?? shop?.address) && (
                <p className="text-sm text-muted-foreground mt-0.5">{branch?.address ?? shop?.address}</p>
              )}
              {(branch?.phone ?? shop?.phone) && (
                <p className="text-sm text-muted-foreground">{branch?.phone ?? shop?.phone}</p>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {pickupTime ? `Ready around ${new Date(pickupTime).toLocaleString()}.` : "We'll have it ready as soon as possible."}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl p-4">
            <h2 className="font-semibold mb-2">Delivery address</h2>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="text-foreground">{order.customer_name}</p>
              {billing?.phone && <p>{billing.phone}</p>}
              {(billing.address || billing.address_line1) && (
                <p>
                  {/* Street line, then area/thana and district, without repeats. */}
                  {[billing.address ?? billing.address_line1, billing.area || billing.thana, billing.district || billing.city]
                    .filter((x, i, all): x is string => !!x && all.indexOf(x) === i)
                    .join(", ")}
                </p>
              )}
              {billing?.note && <p className="italic">Note: {billing.note}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Link>
          <a href={`/api/storefront/orders/${order.id}/invoice`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold hover:border-primary hover:text-primary transition-colors">
            <FileDown className="h-4 w-4" /> Download invoice
          </a>
        </div>
      </div>
    </div>
  );
}
