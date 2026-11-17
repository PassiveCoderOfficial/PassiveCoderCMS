"use client";

import { BankTransferPanel, EMPTY_PROOF, type PaymentProof } from "./bank-transfer-panel";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getDineInTableToken, clearDineInTableToken } from "@/lib/dine-in/table-context";
import { DeliveryPin } from "./delivery-pin";
import { codBlocked, type FoodCheckout } from "@/modules/registry/food-delivery/routing";
import { inZone, type LatLng } from "@/modules/registry/food-delivery/zones";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, string>;
  supported_currencies?: string[] | null;
}

export interface ShippingRateOption {
  id: string;
  name: string;
  rate: number;
  free_above: number | null;
  eta_days: string | null;
  is_default: boolean;
}

const NO_FOOD: FoodCheckout = { restaurant: false, pin: "off", zone: null, advanceAbove: null };

export default function SingleVendorCheckout({ shippingRates = [], tax = { rate: 0, inclusive: false }, food = NO_FOOD }: { shippingRates?: ShippingRateOption[]; tax?: { rate: number; inclusive: boolean }; food?: FoodCheckout }) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { format, currency } = useEcommerceCurrency();
  const [shippingRateId, setShippingRateId] = useState(
    () => (shippingRates.find((r) => r.is_default) ?? shippingRates[0])?.id ?? "",
  );
  const [allGateways, setAllGateways] = useState<Gateway[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    // A food programme restaurant delivers in one Dhaka area only.
    city: food.zone ? "Dhaka" : "",
    state: "",
    postal_code: "",
    country: food.zone ? "Bangladesh" : "",
    notes: "",
  });
  // Delivery map pin (restaurants only; required inside a food delivery zone).
  const [pin, setPin] = useState<LatLng | null>(null);
  // Restaurant pickup/delivery support (2026-09-12): defaults to delivery so
  // an ordinary shop's checkout is unaffected. Toggling to pickup hides the
  // address section entirely — a customer picking up in person has no
  // delivery address to give, and forcing one made every pickup checkout
  // collect a fake address just to satisfy the form.
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup" | "dine_in">("delivery");
  const [pickupTime, setPickupTime] = useState("");
  const isPickup = fulfillmentType === "pickup";
  // Set once, on mount, from the token a QR-code scan stashed
  // (src/app/(site)/table/[qrToken]/table-landing.tsx). Locked decision
  // (docs/business/06-restaurant-vertical.md): dine-in is never a picker
  // option a customer chooses themselves — it's implied entirely by having
  // scanned a table's code, so the UI below just shows it as already chosen
  // rather than offering delivery/pickup/dine-in as three equal buttons.
  const [tableToken, setTableToken] = useState<string | null>(null);
  const isDineIn = fulfillmentType === "dine_in";

  useEffect(() => {
    const token = getDineInTableToken();
    if (token) {
      setTableToken(token);
      setFulfillmentType("dine_in");
    }
  }, []);

  // The store's own payment methods, already filtered by its currency and
  // stripped of any secret keys (see lib/ecommerce/payment-methods).
  useEffect(() => {
    fetch("/api/ecommerce/payment-methods").then((r) => r.json()).then((d) => {
      setAllGateways(((d.methods ?? []) as Gateway[]).map((m) => ({ ...m, id: m.slug })));
    }).catch(() => setAllGateways([]));
  }, []);
  const [proof, setProof] = useState<PaymentProof>(EMPTY_PROOF);

  // Gateways are platform-wide rows, so a store only offers the ones that can
  // take its currency (a riyal store has no use for bKash). If none declare
  // the currency, fall back to the full list rather than a dead checkout.
  useEffect(() => {
    const usable = allGateways.filter(
      (g) => !g.supported_currencies?.length || g.supported_currencies.includes(currency),
    );
    const list = usable.length > 0 ? usable : allGateways;
    setGateways(list);
    setSelectedGateway((prev) => (list.some((g) => g.slug === prev) ? prev : list[0]?.slug ?? ""));
  }, [allGateways, currency]);

  // Delivery charge mirrors the server's own calculation in
  // /api/ecommerce/orders — shown here, never trusted from here.
  const shippingRate = shippingRates.find((r) => r.id === shippingRateId) ?? null;
  const isDelivery = fulfillmentType === "delivery";
  const shippingCost =
    isDelivery && shippingRate && !(shippingRate.free_above !== null && subtotal >= shippingRate.free_above)
      ? shippingRate.rate
      : 0;
  // Same rule as /api/ecommerce/orders: exclusive tax is added on the goods.
  const taxAmount = tax.rate > 0 && !tax.inclusive ? Math.round(subtotal * tax.rate) / 100 : 0;
  const total = subtotal + shippingCost + taxAmount;
  // Food delivery: the restaurant asks for payment first above a set total.
  const noCod = fulfillmentType !== "dine_in" && codBlocked(food, total);
  useEffect(() => {
    if (noCod && selectedGateway === "cod") {
      const next = gateways.find((g) => g.slug !== "cod");
      if (next) setSelectedGateway(next.slug);
    }
  }, [noCod, selectedGateway, gateways]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addressRequired = !isPickup && !isDineIn;
    if (!form.email || !form.first_name || !form.last_name
      || (addressRequired && (!form.address_line1 || !form.city || !form.country))) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!selectedGateway) {
      toast.error("Please select a payment method");
      return;
    }
    if (isDelivery && food.pin === "required" && !pin) {
      toast.error("Please set your delivery location on the map");
      return;
    }
    if (isDelivery && food.zone && pin && !inZone(food.zone.key, pin)) {
      toast.error(`This restaurant delivers inside ${food.zone.name} only. Move the pin or choose Pickup.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ecommerce/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          billing_address: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: form.country,
          },
          payment_method: selectedGateway,
          ...(["bank_transfer", "bkash", "nagad"].includes(selectedGateway) ? { payment_proof: proof } : {}),
          notes: form.notes,
          fulfillment_type: fulfillmentType,
          shipping_rate_id: isDelivery && shippingRate ? shippingRate.id : undefined,
          pickup_time: isPickup ? pickupTime : undefined,
          table_qr_token: isDineIn ? tableToken : undefined,
          delivery_location: isDelivery && pin ? pin : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to place order");
        setSubmitting(false);
        return;
      }

      clearCart();
      // The table was for this one visit/order — clear it so a second,
      // later order from the same browser tab doesn't silently reuse a
      // stale table token instead of asking again.
      if (isDineIn) clearDineInTableToken();
      router.push(`/order-confirmation/${data.orderId}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-14 w-14 text-muted-foreground opacity-30 mx-auto mb-6" />
        <h1 className="text-xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/" className="text-primary underline underline-offset-2 text-sm">Continue Shopping</Link>
      </div>
    );
  }

  const shownGateways = noCod ? gateways.filter((g) => g.slug !== "cod") : gateways;
  const selectedGw = shownGateways.find((g) => g.slug === selectedGateway);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Cart
      </Link>

      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <section className="border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            </section>

            {/* Fulfillment */}
            <section className="border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">How would you like to get this?</h2>
              {isDineIn ? (
                // Not a choice here — scanning the table's QR code already
                // decided it. Showing delivery/pickup buttons next to a
                // dine-in order would invite a customer sitting at the
                // table to accidentally pick "delivery" for no reason.
                <div className="rounded-lg border-2 border-primary bg-primary/5 px-4 py-3 text-sm font-medium">
                  Dine-in — served to your table
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("delivery")}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${fulfillmentType === "delivery" ? "border-primary bg-primary/5" : "border-input"}`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("pickup")}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${isPickup ? "border-primary bg-primary/5" : "border-input"}`}
                  >
                    Pickup
                  </button>
                </div>
              )}
              {isDelivery && shippingRates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Delivery area</p>
                  {shippingRates.map((r) => {
                    const free = r.rate === 0 || (r.free_above !== null && subtotal >= r.free_above);
                    return (
                      <label key={r.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${shippingRateId === r.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                        <input
                          type="radio"
                          name="shipping_rate"
                          value={r.id}
                          checked={shippingRateId === r.id}
                          onChange={() => setShippingRateId(r.id)}
                          className="accent-primary"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium">{r.name}</span>
                          {(r.eta_days || r.free_above !== null) && (
                            <span className="block text-xs text-muted-foreground">
                              {[r.eta_days, r.free_above !== null ? `Free over ${format(r.free_above)}` : null].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-semibold shrink-0">{free ? "Free" : format(r.rate)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {isPickup && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Pickup Time</label>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground">Leave blank for as soon as possible.</p>
                </div>
              )}
            </section>

            {/* Shipping address — pickup has nowhere to deliver to and
                dine-in customers are already at the table, so this whole
                section is skipped rather than collecting an address
                nobody needs. */}
            {!isPickup && !isDineIn && (
              <section className="border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{food.restaurant ? "Delivery Address" : "Shipping Address"}</h2>
                {food.pin !== "off" && <DeliveryPin cfg={food} value={pin} onChange={setPin} />}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Address Line 1 <span className="text-red-500">*</span></label>
                  <input name="address_line1" value={form.address_line1} onChange={handleChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Address Line 2</label>
                  <input name="address_line2" value={form.address_line2} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">City <span className="text-red-500">*</span></label>
                    <input name="city" value={form.city} onChange={handleChange} required
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">State / Province</label>
                    <input name="state" value={form.state} onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Postal Code</label>
                    <input name="postal_code" value={form.postal_code} onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Country <span className="text-red-500">*</span></label>
                  <input name="country" value={form.country} onChange={handleChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </section>
            )}

            {/* Payment method */}
            <section className="border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Payment Method</h2>
              {noCod && food.advanceAbove != null && (
                <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                  For orders above ৳{Math.round(food.advanceAbove)} this restaurant asks you to pay by bKash or Nagad first.
                </p>
              )}
              {shownGateways.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment methods available. Contact the store.</p>
              ) : (
                <div className="space-y-2">
                  {shownGateways.map((gw) => (
                    <label key={gw.slug} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedGateway === gw.slug ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                      <input
                        type="radio"
                        name="payment_method"
                        value={gw.slug}
                        checked={selectedGateway === gw.slug}
                        onChange={() => setSelectedGateway(gw.slug)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{gw.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedGw?.slug === "cod" && (
                <p className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  {isPickup ? "Pay when you collect your order." : "Pay in cash when your order is delivered."}
                </p>
              )}

              {selectedGw?.slug === "whatsapp" && (
                <p className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  {selectedGw.settings?.note || "Place the order, then send it to us on WhatsApp. We confirm the price, delivery time and payment with you there."}
                </p>
              )}

              {selectedGw?.slug === "bank_transfer" && (
                <BankTransferPanel settings={(selectedGw.settings ?? {}) as Record<string, string>} total={format(total)} proof={proof} onChange={setProof} />
              )}

              {/* bKash / Nagad: send money to the store's number, quote the transaction ID */}
              {(selectedGw?.slug === "bkash" || selectedGw?.slug === "nagad") && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-semibold">Pay {format(total)} by {selectedGw.name}</p>
                  {selectedGw.settings?.number ? (
                    <p>Send Money to <span className="font-mono font-semibold text-base">{selectedGw.settings.number}</span>{selectedGw.settings.account_type ? ` (${selectedGw.settings.account_type})` : ""}</p>
                  ) : (
                    <p className="text-muted-foreground">We will send you the {selectedGw.name} number after you place the order.</p>
                  )}
                  {selectedGw.settings?.instructions && <p className="text-muted-foreground whitespace-pre-wrap">{selectedGw.settings.instructions}</p>}
                  <div className="grid gap-2 sm:grid-cols-2 pt-1">
                    <input value={proof.transaction_id} onChange={(e) => setProof({ ...proof, transaction_id: e.target.value })} placeholder="Transaction ID (TrxID)" className="rounded-lg border bg-background px-3 py-2 text-sm" />
                    <input value={proof.bank} onChange={(e) => setProof({ ...proof, bank: e.target.value })} placeholder="Number you sent from" className="rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">Paid later? Leave these blank and send us the TrxID on WhatsApp.</p>
                </div>
              )}

              {/* Manual gateway instructions */}
              {selectedGw?.slug === "manual" && selectedGw.settings?.instructions && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                  <p className="font-semibold">Payment Instructions</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedGw.settings.instructions}</p>
                  {selectedGw.settings.account_details && (
                    <p className="text-muted-foreground">{selectedGw.settings.account_details}</p>
                  )}
                </div>
              )}
            </section>

            {/* Order notes */}
            <section className="border rounded-xl p-6 space-y-3">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Order Notes (optional)</h2>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Special instructions for your order..."
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </section>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-1">
            <div className="border rounded-xl p-6 space-y-4 sticky top-24">
              <h2 className="font-semibold text-base">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg border overflow-hidden bg-muted shrink-0">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0">{format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{format(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isDelivery ? "Delivery" : "Shipping"}</span>
                  {shippingCost > 0 ? <span>{format(shippingCost)}</span> : <span className="text-muted-foreground">Free</span>}
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax / VAT ({tax.rate}%)</span>
                    <span>{format(taxAmount)}</span>
                  </div>
                )}
                {tax.inclusive && tax.rate > 0 && (
                  <p className="text-xs text-muted-foreground">Prices include {tax.rate}% tax / VAT.</p>
                )}
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{format(total)}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || gateways.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
