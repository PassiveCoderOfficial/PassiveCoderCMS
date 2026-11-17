"use client";

import React, { useState } from "react";
import { MessageCircle, Send, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useSiteContact, waLink } from "@/components/site/site-contact-context";
import { hasPrice, resolveNoPrice, type NoPriceSetting } from "@/lib/ecommerce/price-display";

type PriceProduct = { id: string; name: string; slug?: string; price: number | string | null | undefined; noPrice?: NoPriceSetting | null };

/**
 * How a product's price shows. `priced` false means the product has no price:
 * `mode` says what to show instead (WhatsApp button, request form, or 0).
 * `sellable` is false when the shopper must ask first (no add to cart).
 */
export function useProductPrice(product: PriceProduct) {
  const { noPrice } = useSiteContact();
  const priced = hasPrice(product.price);
  const { mode, label } = resolveNoPrice(product.noPrice, noPrice);
  return { priced, mode, label, sellable: priced || mode === "zero", price: priced ? Number(product.price) : 0 };
}

/**
 * The "ask" button for a product with no price. WhatsApp mode opens a chat
 * with the product named; request mode opens a short form that lands in
 * Ecommerce → Price Requests. Pass the card's own button classes so it
 * matches the card it sits on.
 */
export function AskPriceButton({ product, className, style, compact }: { product: PriceProduct; className?: string; style?: React.CSSProperties; compact?: boolean }) {
  const { whatsapp, phone } = useSiteContact();
  const { mode, label } = useProductPrice(product);
  const [open, setOpen] = useState(false);
  if (mode === "zero") return null;

  if (mode === "whatsapp") {
    const url = typeof window !== "undefined" ? `${window.location.origin}/products/${product.slug ?? ""}` : "";
    const href = waLink(whatsapp ?? phone, `Hi, what is the price of ${product.name}?${product.slug ? `\n${url}` : ""}`);
    return (
      <a href={href ?? "#"} target="_blank" rel="noopener noreferrer" className={className} style={style} onClick={(e) => e.stopPropagation()}>
        <MessageCircle className={compact ? "w-3.5 h-3.5 mr-1.5 shrink-0" : "w-4 h-4 mr-2 shrink-0"} />{label}
      </a>
    );
  }

  return (
    <>
      <button type="button" className={className} style={style} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
        <Send className={compact ? "w-3.5 h-3.5 mr-1.5 shrink-0" : "w-4 h-4 mr-2 shrink-0"} />{label}
      </button>
      {open && <PriceRequestDialog product={product} title={label} onClose={() => setOpen(false)} />}
    </>
  );
}

function PriceRequestDialog({ product, title, onClose }: { product: PriceProduct; title: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", quantity: "", message: "", website: "" });
  const [opened] = useState(() => Date.now());
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/ecommerce/price-request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, productId: product.id, elapsedMs: Date.now() - opened }),
    }).catch(() => null);
    setBusy(false);
    const d = await res?.json().catch(() => ({}));
    if (!res?.ok) { toast.error(d?.error ?? "Could not send. Please try again."); return; }
    setDone(true);
  }

  const input = "w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <div className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-background text-foreground shadow-2xl p-5 text-left" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{product.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {done ? (
          <div className="py-6 text-center space-y-3">
            <p className="font-medium">Thank you. Your request is sent.</p>
            <p className="text-sm text-muted-foreground">We will reply with the price soon.</p>
            <button type="button" onClick={onClose} className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input className={input} placeholder="Your name *" required value={f.name} onChange={set("name")} />
            <input className={input} placeholder="Phone / WhatsApp *" required type="tel" value={f.phone} onChange={set("phone")} />
            <input className={input} placeholder="Email (optional)" type="email" value={f.email} onChange={set("email")} />
            <input className={input} placeholder="Quantity (e.g. 5 kg, 10 boxes)" value={f.quantity} onChange={set("quantity")} />
            <textarea className={`${input} h-20 py-2 resize-none`} placeholder="Message (optional)" value={f.message} onChange={set("message")} />
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={set("website")} />
            <button type="submit" disabled={busy} className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
