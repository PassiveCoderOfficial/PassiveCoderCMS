import { NextRequest, NextResponse, after } from "next/server";
import { enrollInSequences } from "@/lib/crm/sequences";
import { createClient } from "@/lib/supabase/server";
import type { CartItem, Address } from "@/types/cms";
import { upsertContact } from "@/lib/crm/upsertContact";
import { getStorePaymentMethods } from "@/lib/ecommerce/payment-methods";
import { getSiteCurrency } from "@/lib/currency/currency-server";
import { notifyTenantEvent } from "@/lib/push/notify";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { findBlock } from "@/lib/spam/guard";
import { loadBranchPins, loadFoodCheckout, getFoodHubSettings } from "@/modules/registry/food-delivery/server";
import { ADVANCE_REQUIRED_ERROR, codBlocked, planRouting } from "@/modules/registry/food-delivery/routing";
import { FOOD_VIA_COOKIE, orderAttribution } from "@/modules/registry/food-delivery/attribution";

type BillingAddress = Address & { email: string; phone?: string };

interface OrderPayload {
  items: CartItem[];
  billing_address: BillingAddress;
  payment_method: string;
  notes?: string;
  /** Restaurant pickup/delivery support (2026-09-12) — defaults to
   *  "delivery" so every existing caller is unaffected. "dine_in" added for
   *  the restaurant vertical (docs/business/06-restaurant-vertical.md). */
  fulfillment_type?: "delivery" | "pickup" | "dine_in";
  pickup_time?: string;
  /** dine_in only: the qr_token printed on the table, never the raw table
   *  id — resolved server-side below so a client can't address an
   *  arbitrary table_id it was never shown. */
  table_qr_token?: string;
  /** Delivery zone picked at checkout (shipping_rates.id). Only the id is
   *  accepted — the charge is looked up and recalculated server-side. */
  shipping_rate_id?: string;
  /** Bank transfer: what the shopper paid with. All optional. */
  payment_proof?: { transaction_id?: string; bank?: string; note?: string; file_url?: string };
  /** Delivery map pin from checkout ("Use my location" or the dragged pin).
   *  Checked server-side against the restaurant's zone (food delivery). */
  delivery_location?: { lat: number; lng: number };
}

/** Most lines one order may carry; a real basket is far below this. */
const MAX_LINES = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  // A shopper places a handful of orders at most, and a busy restaurant's
  // tables share one Wi-Fi address; this only stops scripted floods.
  const limited = tooMany(req, "store-order", 60);
  if (limited) return limited;
  try {
    // Set by the proxy from the host the store is served on; a visitor's own
    // header never gets through. No store, no order.
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) return NextResponse.json({ error: "Store not found" }, { status: 400 });
    const body: OrderPayload = await req.json();

    const { items, billing_address, payment_method, notes, fulfillment_type, pickup_time, table_qr_token, shipping_rate_id, payment_proof, delivery_location } = body;
    const isDineIn = fulfillment_type === "dine_in";

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (items.length > MAX_LINES) {
      return NextResponse.json({ error: "Too many items in one order" }, { status: 400 });
    }
    // Every line: a product id, an optional option id, and a whole quantity
    // from 1 to 999. Nothing else on the line is taken from the browser.
    for (const item of items) {
      if (!item || typeof item !== "object" || typeof item.product_id !== "string" || !UUID.test(item.product_id)
        || (item.variant_id != null && item.variant_id !== "" && (typeof item.variant_id !== "string" || !UUID.test(item.variant_id)))) {
        return NextResponse.json({ error: "Your cart has an item we could not read. Please refresh the page and try again." }, { status: 400 });
      }
      const raw: unknown = item.quantity;
      const q = typeof raw === "string" && /^\d{1,3}$/.test(raw) ? Number(raw) : raw;
      if (typeof q !== "number" || !Number.isInteger(q) || q < 1 || q > 999) {
        return NextResponse.json({ error: "Quantity must be a whole number from 1 to 999 for each item." }, { status: 400 });
      }
      item.quantity = q;
      if (!item.variant_id) item.variant_id = undefined;
    }
    if (!billing_address?.email) {
      return NextResponse.json({ error: "Billing address required" }, { status: 400 });
    }
    // Dine-in has no address to give — the customer is at the table the QR
    // code was printed on, which the token below identifies server-side.
    if (isDineIn && !table_qr_token) {
      return NextResponse.json({ error: "Missing table" }, { status: 400 });
    }

    const supabase = await createClient();

    // Resolve the table from its qr_token, never trust a client-sent table
    // id directly — the token is the only thing the customer actually saw
    // (printed on the table), so it's the only thing that should carry
    // authority here. Also recovers branch_id from the table's own branch,
    // rather than trusting a client-sent branch_id that could be swapped
    // for a different tenant's branch. Uses the admin client: restaurant_tables
    // has no public SELECT policy (migration 088) — the qr_token match plus
    // the tenant_id check right below is the access control here, not RLS.
    let branchId: string | null = null;
    let tableId: string | null = null;
    if (isDineIn) {
      const { createAdminClient: createAdmin } = await import("@/lib/supabase/server");
      const adminForTable = await createAdmin();
      const { data: table } = await adminForTable
        .from("restaurant_tables")
        .select("id, branch_id, is_active, restaurant_branches!inner(tenant_id, is_active)")
        .eq("qr_token", table_qr_token)
        .maybeSingle();
      const branch = (table as unknown as { restaurant_branches?: { tenant_id: string; is_active: boolean } } | null)
        ?.restaurant_branches;
      if (!table || !table.is_active || !branch?.is_active || (tenantId && branch.tenant_id !== tenantId)) {
        return NextResponse.json({ error: "Table not found" }, { status: 400 });
      }
      tableId = table.id;
      branchId = table.branch_id;
    }

    // Food delivery (clients/FoodDelivery/PLAN.md, phase 1): a restaurant's
    // web delivery and pickup orders get a branch and kitchen_status, so they
    // reach the kitchen board and riders. A food programme restaurant also
    // needs a delivery pin inside its zone. Other stores are unchanged.
    const fulfillment = isDineIn ? "dine_in" : fulfillment_type === "pickup" ? "pickup" : "delivery";
    const foodCfg = await loadFoodCheckout(tenantId);
    const routing = planRouting({
      cfg: foodCfg,
      fulfillment,
      branches: foodCfg.restaurant && tenantId && !isDineIn ? await loadBranchPins(tenantId) : [],
      pin: delivery_location,
      tableBranchId: branchId,
    });
    if (!routing.ok) return NextResponse.json({ error: routing.error }, { status: 400 });
    branchId = routing.branchId;

    // Verify products still active + get current prices
    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: dbProducts } = await supabase
      .from("products")
      .select("id, name, slug, images, price, stock_quantity, status, track_inventory")
      .in("id", productIds)
      .eq("status", "active")
      .eq("tenant_id", tenantId);

    if (!dbProducts?.length) {
      return NextResponse.json({ error: "Products not found or unavailable" }, { status: 400 });
    }
    // Every line must be an active product of THIS store. A line for an
    // unknown, inactive or another store's product used to stay in the order
    // at price 0 under the name the browser sent.
    const productMap = new Map(dbProducts.map((p) => [p.id as string, p]));
    if (items.some((i) => !productMap.has(i.product_id))) {
      return NextResponse.json({ error: "An item in your cart is no longer available. Please remove it and try again." }, { status: 400 });
    }
    // Size/colour lines are priced from their own variant row, which must
    // belong to the product on the same line.
    const variantIds = [...new Set(items.map((i) => i.variant_id).filter((v): v is string => !!v))];
    const variantMap = new Map<string, { product_id: string; price: number; stock: number | null; name: string; image: string | null }>();
    if (variantIds.length) {
      // Only options of this store's own products on this order.
      const { data: vRows } = await supabase
        .from("product_variants")
        .select("id, product_id, price, is_active, stock_quantity, name, image")
        .in("id", variantIds)
        .in("product_id", productIds);
      for (const v of vRows ?? []) if (v.is_active !== false && productMap.has(v.product_id)) variantMap.set(v.id, { product_id: v.product_id, price: Number(v.price), stock: v.stock_quantity === null ? null : Number(v.stock_quantity), name: v.name, image: (v.image as string | null) ?? null });
    }
    for (const item of items) {
      if (!item.variant_id) continue;
      const v = variantMap.get(item.variant_id);
      if (!v || v.product_id !== item.product_id) {
        return NextResponse.json({ error: "A selected option is no longer available" }, { status: 400 });
      }
      // Variations with a stock number can't be sold beyond it.
      const wanted = items.filter((x) => x.variant_id === item.variant_id).reduce((n, x) => n + Number(x.quantity || 0), 0);
      if (v.stock !== null && wanted > v.stock) {
        return NextResponse.json({ error: v.stock <= 0 ? `${v.name} is sold out` : `Only ${v.stock} left of ${v.name}` }, { status: 400 });
      }
    }
    // Each line is rebuilt from the database: name, address, picture and
    // price are the store's own, only the quantity is the shopper's.
    const firstImage = (images: unknown): string | undefined => {
      const first = Array.isArray(images) ? images[0] : undefined;
      if (typeof first === "string") return first || undefined;
      const url = (first as { url?: unknown } | undefined)?.url;
      return typeof url === "string" && url ? url : undefined;
    };
    const verifiedItems: CartItem[] = items.map((item) => {
      const product = productMap.get(item.product_id)!;
      const variant = item.variant_id ? variantMap.get(item.variant_id)! : null;
      const image = variant?.image || firstImage(product.images);
      const price = variant
        ? variant.price
        // No price on the product (Message / Request for price, or "show 0"):
        // it goes in at 0 and the store confirms the price. Never trust the
        // client's price here.
        : Number(product.price ?? 0);
      return {
        id: variant ? `${product.id}:${item.variant_id}` : (product.id as string),
        product_id: product.id as string,
        ...(variant ? { variant_id: item.variant_id as string } : {}),
        name: variant ? `${product.name} - ${variant.name}` : (product.name as string),
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        quantity: item.quantity,
        ...(image ? { image } : {}),
        slug: (product.slug as string) ?? "",
      };
    });

    const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Delivery charge from the tenant's own zones. A tenant with no
    // shipping_rates rows (or a pickup / dine-in order) stays at 0, exactly
    // as before zones existed here.
    let shipping_cost = 0;
    const isDelivery = !isDineIn && fulfillment_type !== "pickup";
    if (isDelivery && tenantId && shipping_rate_id) {
      const { data: rate } = await supabase
        .from("shipping_rates")
        .select("rate, free_above")
        .eq("id", shipping_rate_id)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (!rate) {
        return NextResponse.json({ error: "Delivery area not found" }, { status: 400 });
      }
      const freeAbove = rate.free_above === null ? null : Number(rate.free_above);
      shipping_cost = freeAbove !== null && subtotal >= freeAbove ? 0 : Number(rate.rate);
    }
    // Tax / VAT from Shop > Settings. Inclusive: prices already contain it,
    // nothing is added (the receipt shows 0). Exclusive: added on the goods.
    // Audit 2026-10-18: this was hard-coded to 0, so a 15% VAT setting did nothing.
    const { data: taxCfg } = tenantId
      ? await supabase.from("ecommerce_settings").select("tax_rate, tax_inclusive").eq("tenant_id", tenantId).maybeSingle()
      : { data: null };
    const taxRate = Number(taxCfg?.tax_rate) || 0;
    const tax = taxRate > 0 && !taxCfg?.tax_inclusive ? Math.round(subtotal * taxRate) / 100 : 0;
    const total = subtotal + shipping_cost + tax;
    // Food delivery: a restaurant can ask for bKash/Nagad first on big orders.
    if (!isDineIn && payment_method === "cod" && codBlocked(foodCfg, total)) {
      return NextResponse.json({ error: ADVANCE_REQUIRED_ERROR(foodCfg.advanceAbove!) }, { status: 400 });
    }

    {
      const cfg = await getSiteCurrency(tenantId);
      const offered = await getStorePaymentMethods(tenantId, cfg.currency);
      if (!isDineIn && offered.length && !offered.some((m) => m.slug === payment_method)) {
        return NextResponse.json({ error: "That payment method is not available" }, { status: 400 });
      }
    }

    // Only keep a receipt the shopper actually uploaded to this store's folder.
    let paymentProof: Record<string, string> | null = null;
    if (["bank_transfer", "bkash", "nagad"].includes(payment_method) && payment_proof && tenantId) {
      const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
      const file = clip(payment_proof.file_url, 600);
      paymentProof = {
        transaction_id: clip(payment_proof.transaction_id, 120),
        bank: clip(payment_proof.bank, 120),
        note: clip(payment_proof.note, 1000),
        file_url: file.includes(`/media/payment-proofs/${tenantId}/`) ? file : "",
      };
      if (!Object.values(paymentProof).some(Boolean)) paymentProof = null;
    }

    const orderNumber = `ORD-${Date.now()}`;

    const orderRow: Record<string, unknown> = {
      order_number: orderNumber,
      customer_email: billing_address.email,
      customer_name: `${billing_address.first_name} ${billing_address.last_name}`.trim(),
      status: "pending",
      payment_status: "pending",
      payment_method,
      items: verifiedItems,
      billing_address,
      payment_proof: paymentProof,
      subtotal,
      discount: 0,
      shipping_cost,
      tax,
      total,
      notes: notes ?? null,
      fulfillment_type: fulfillment,
      // A blank datetime-local input sends "" (not null/undefined), and ""
      // is not a valid timestamptz -- caught live, this 500'd every pickup
      // order with an empty pickup time, i.e. the common case ("leave blank
      // for ASAP"). Must check for an empty string explicitly, not just ??.
      pickup_time: fulfillment_type === "pickup" && pickup_time?.trim() ? pickup_time : null,
      branch_id: branchId,
      table_id: tableId,
      // See planRouting: dine-in, pickup and a restaurant's delivery orders
      // go to the kitchen; another store's delivery order has no kitchen.
      kitchen_status: routing.kitchenStatus,
      delivery_lat: routing.pin?.lat ?? null,
      delivery_lng: routing.pin?.lng ?? null,
      // Food hub commission: only when the customer came from the hub and the
      // restaurant is in the programme (rate saved as it is today).
      ...orderAttribution(
        req.cookies.get(FOOD_VIA_COOKIE)?.value,
        req.cookies.get(FOOD_VIA_COOKIE)?.value === "hub" && tenantId ? await getFoodHubSettings(tenantId) : null,
      ),
    };

    if (tenantId) orderRow.tenant_id = tenantId;

    // Insert with the service role — anonymous checkout no longer relies on a
    // wide-open RLS insert policy (dropped in migration 035)
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminDb = await createAdminClient();
    const { data: order, error } = await adminDb
      .from("orders")
      .insert(orderRow)
      .select("id, order_number")
      .single();

    if (error) {
      console.error("Order insert error:", error);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Decrement stock for tracked products (floor at 0)
    {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = await createAdminClient();
      for (const item of verifiedItems) {
        // Variation lines take stock from the variation (when it has a number).
        if (item.variant_id) {
          const v = variantMap.get(item.variant_id);
          if (v && v.stock !== null) {
            await admin.from("product_variants").update({ stock_quantity: Math.max(0, v.stock - item.quantity) }).eq("id", item.variant_id).eq("product_id", v.product_id);
            v.stock = Math.max(0, v.stock - item.quantity);
          }
          continue;
        }
        const product = dbProducts.find((p) => p.id === item.product_id);
        if (!product?.track_inventory) continue;
        const next = Math.max(0, (product.stock_quantity ?? 0) - item.quantity);
        await admin.from("products")
          .update({ stock_quantity: next, updated_at: new Date().toISOString() })
          .eq("id", product.id)
          .eq("tenant_id", tenantId);
      }
    }

    // A signed-in customer's saved address with the same first line keeps the pin.
    if (tenantId && routing.pin && billing_address.address_line1) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await adminDb.from("customer_addresses")
          .update({ lat: routing.pin.lat, lng: routing.pin.lng })
          .eq("tenant_id", tenantId).eq("customer_id", user.id)
          .ilike("address_line1", billing_address.address_line1.trim().replace(/[\\%_]/g, "\\$&"));
      }
    }

    if (tenantId) {
      const orderContactId = await upsertContact({
        tenantId,
        email: billing_address.email,
        phone: billing_address.phone,
        firstName: billing_address.first_name,
        lastName: billing_address.last_name,
        source: "order",
        tags: ["customer"],
        event: {
          type: "order",
          title: `Order ${order.order_number} — ${total}`,
          meta: { order_id: order.id, order_number: order.order_number, total, items: verifiedItems.length },
        },
      }).catch(() => null);
      // Follow-up sequences run after the response; never fail the order.
      const seqTenant = tenantId;
      if (orderContactId) after(() => enrollInSequences(seqTenant, orderContactId, "order", {
        name: [billing_address.first_name, billing_address.last_name].filter(Boolean).join(" ") || null,
        phone: billing_address.phone ?? null, service: `order ${order.order_number}`,
      }).catch(() => undefined));
    }

    // A banned customer's order still goes through, with a warning: a wrong ban must never lose a sale.
    const flagged = tenantId ? await findBlock(adminDb, tenantId, { email: billing_address.email, phone: billing_address.phone, ip: clientIp(req) }).catch(() => null) : null;
    if (flagged) await adminDb.from("orders").update({ flagged_reason: `Customer is on the blocked list (${flagged.kind})` }).eq("id", order.id);
    if (tenantId) await notifyTenantEvent({ tenantId, type: paymentProof ? "order_action" : "order", id: order.id, dedupeKey: `order:${order.id}`, title: flagged ? `Check order ${order.order_number}: customer is on your blocked list` : paymentProof ? `New order ${order.order_number}: check payment proof` : `New order ${order.order_number}`, body: `${billing_address?.first_name ?? "A customer"} ordered ${verifiedItems.length} item${verifiedItems.length === 1 ? "" : "s"}, total ${total}`, webUrl: "/dashboard/ecommerce/orders" });
    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
  } catch (err) {
    console.error("Orders route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
