import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSiteCurrency } from "@/lib/currency/currency-server";
import { renderOrderInvoicePdf, type InvoiceParcel } from "@/lib/ecommerce/order-invoice-pdf";
import type { CartItem } from "@/types/cms";

interface Addr { name?: string; phone?: string; email?: string; address?: string; address_line1?: string; area?: string; city?: string; first_name?: string; last_name?: string }

/**
 * Download an order's invoice as a PDF. Same access rule as the order
 * confirmation page: the order's unguessable id, scoped to this store, so a
 * guest who checked out can download theirs too.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = await createAdminClient();
  const { data: order } = await admin.from("orders")
    .select("id, order_number, status, payment_status, payment_method, items, billing_address, shipping_address, customer_name, customer_email, subtotal, discount, shipping_cost, total, created_at")
    .eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: subs }, { data: site }, { data: contact }, currency] = await Promise.all([
    admin.from("sub_orders").select("sub_order_number, items, shipping_cost, discount, platform_discount, vendors(name)").eq("order_id", id).order("created_at"),
    admin.from("site_identity").select("site_name").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("contact_details").select("phone, email, address").eq("tenant_id", tenantId).order("is_primary", { ascending: false }).limit(1).maybeSingle(),
    getSiteCurrency(tenantId),
  ]);

  const lines = (items: unknown) => ((items ?? []) as CartItem[]).map((i) => ({ name: i.name, quantity: Number(i.quantity), price: Number(i.price) }));
  const parcels: InvoiceParcel[] = subs?.length
    ? subs.map((s) => ({
        seller: (s.vendors as unknown as { name: string } | null)?.name ?? null,
        number: s.sub_order_number,
        lines: lines(s.items),
        shipping: Number(s.shipping_cost ?? 0),
        discount: Number(s.discount ?? 0) + Number(s.platform_discount ?? 0),
      }))
    : [{ seller: null, number: null, lines: lines(order.items), shipping: Number(order.shipping_cost ?? 0), discount: Number(order.discount ?? 0) }];

  const a = ((order.shipping_address ?? order.billing_address ?? {}) as Addr);
  const subtotal = Number(order.subtotal ?? parcels.reduce((s, p) => s + p.lines.reduce((t, l) => t + l.price * l.quantity, 0), 0));
  const pdf = await renderOrderInvoicePdf({
    store: { name: site?.site_name ?? "Store", phone: contact?.phone, email: contact?.email, address: contact?.address },
    order: {
      number: order.order_number ?? order.id.slice(0, 8), date: order.created_at, status: order.status ?? "pending",
      payment_method: order.payment_method, payment_status: order.payment_status,
      subtotal, shipping: Number(order.shipping_cost ?? 0),
      discount: Number(order.discount ?? 0) || Math.max(0, subtotal + Number(order.shipping_cost ?? 0) - Number(order.total ?? 0)),
      total: Number(order.total ?? 0),
    },
    billTo: {
      name: a.name ?? ([a.first_name, a.last_name].filter(Boolean).join(" ") || order.customer_name || undefined),
      // Guest checkouts without an email store a placeholder; leave it off.
      phone: a.phone, email: [a.email, order.customer_email].find((e) => e && !/\.local$|@mobile\.passivecoder\.com$/.test(e)) ?? undefined,
      address: [a.address ?? a.address_line1, a.area, a.city !== a.area ? a.city : null].filter(Boolean).join(", "),
    },
    parcels,
    currency: currency.currency === "BDT" ? "Tk" : currency.currency,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${String(order.order_number ?? order.id).replace(/[^\w-]/g, "")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
