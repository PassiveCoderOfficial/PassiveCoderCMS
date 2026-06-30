"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, string>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { format } = useEcommerceCurrency();
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
    city: "",
    state: "",
    postal_code: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.from("payment_gateways").select("id, name, slug, settings").eq("is_enabled", true).then(({ data }) => {
      const list = (data as Gateway[]) ?? [];
      setGateways(list);
      if (list.length > 0) setSelectedGateway(list[0].slug);
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.first_name || !form.last_name || !form.address_line1 || !form.city || !form.country) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!selectedGateway) {
      toast.error("Please select a payment method");
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
          notes: form.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to place order");
        setSubmitting(false);
        return;
      }

      clearCart();
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

  const selectedGw = gateways.find((g) => g.slug === selectedGateway);

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

            {/* Shipping address */}
            <section className="border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Shipping Address</h2>
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

            {/* Payment method */}
            <section className="border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Payment Method</h2>
              {gateways.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment methods available. Contact the store.</p>
              ) : (
                <div className="space-y-2">
                  {gateways.map((gw) => (
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
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">Free</span>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{format(subtotal)}</span>
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
