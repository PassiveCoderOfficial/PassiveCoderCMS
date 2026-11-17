"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MessageCircle, Mail, Phone, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { waLink } from "@/components/site/site-contact-context";

export type PriceRequest = {
  id: string; product_id: string | null; product_name: string;
  name: string; phone: string | null; email: string | null; quantity: string | null; message: string | null;
  status: "open" | "quoted" | "closed"; quoted_price: number | null;
  thread: { from: "customer" | "store"; text: string; at: string; via?: string }[];
  created_at: string;
};

const STATUS: Record<PriceRequest["status"], string> = {
  open: "bg-amber-100 text-amber-800", quoted: "bg-emerald-100 text-emerald-800", closed: "bg-neutral-200 text-neutral-700",
};
const when = (s: string) => new Date(s).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function PriceRequestsClient({ initial, products }: { initial: PriceRequest[]; products: { id: string; slug: string; price: number | null }[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<"open" | "quoted" | "closed" | "all">("open");
  const [openId, setOpenId] = useState<string | null>(initial.find((r) => r.status === "open")?.id ?? initial[0]?.id ?? null);
  const list = useMemo(() => rows.filter((r) => filter === "all" || r.status === filter), [rows, filter]);
  const cur = rows.find((r) => r.id === openId) ?? null;
  const product = cur?.product_id ? products.find((p) => p.id === cur.product_id) : undefined;

  const [reply, setReply] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(body: Record<string, unknown>) {
    if (!cur) return;
    setBusy(true);
    const res = await fetch(`/api/ecommerce/price-request/${cur.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast.error(d.error ?? "Could not save"); return false; }
    setRows((rs) => rs.map((r) => (r.id === cur.id ? d.request : r)));
    if (body.price !== undefined && product) product.price = Number(body.price);
    toast.success(body.reply ? (d.emailed ? "Reply emailed" : "Reply saved") : "Saved");
    return true;
  }

  const waReply = cur ? waLink(cur.phone, reply.trim() || `Hi ${cur.name}, the price of ${cur.product_name} is AED ${price || "..."}.`) : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(["open", "quoted", "closed", "all"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium border capitalize", filter === f ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
            {f} {f !== "all" && <span className="opacity-70">({rows.filter((r) => r.status === f).length})</span>}
          </button>
        ))}
      </div>

      {!rows.length ? (
        <div className="border rounded-xl p-10 text-center text-sm text-muted-foreground">
          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No price requests yet. They appear when a product with no price is set to &ldquo;Request Price&rdquo;.
        </div>
      ) : (
        <div className="grid md:grid-cols-[18rem_1fr] gap-4">
          <div className="border rounded-xl divide-y max-h-[70vh] overflow-y-auto">
            {list.map((r) => (
              <button key={r.id} type="button" onClick={() => { setOpenId(r.id); setReply(""); setPrice(""); }}
                className={cn("w-full text-left px-3 py-2.5 hover:bg-muted/50", r.id === openId && "bg-muted")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{r.product_name}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize shrink-0", STATUS[r.status])}>{r.status}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{r.name}{r.quantity ? ` · ${r.quantity}` : ""} · {when(r.created_at)}</div>
              </button>
            ))}
            {!list.length && <p className="p-4 text-xs text-muted-foreground">Nothing here.</p>}
          </div>

          {cur && (
            <div className="border rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{cur.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current price: {product?.price != null ? `AED ${product.price}` : "blank"}
                    {product && <Link href={`/dashboard/ecommerce/products/${product.id}`} className="ml-2 text-primary inline-flex items-center gap-0.5 text-xs">Edit product <ExternalLink className="w-3 h-3" /></Link>}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {cur.status !== "closed"
                    ? <Button size="sm" variant="outline" disabled={busy} onClick={() => send({ status: "closed" })}>Close</Button>
                    : <Button size="sm" variant="outline" disabled={busy} onClick={() => send({ status: "open" })}>Reopen</Button>}
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <p className="font-medium">{cur.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                  {cur.phone && <a href={`tel:${cur.phone}`} className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{cur.phone}</a>}
                  {cur.email && <a href={`mailto:${cur.email}`} className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{cur.email}</a>}
                  {cur.quantity && <span>Quantity: {cur.quantity}</span>}
                  <span>{when(cur.created_at)}</span>
                </div>
              </div>

              <div className="space-y-2">
                {cur.thread.map((m, i) => (
                  <div key={i} className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap", m.from === "store" ? "ml-auto bg-primary/10" : "bg-muted")}>
                    {m.text}
                    <div className="text-[10px] text-muted-foreground mt-1">{m.from === "store" ? `You${m.via ? ` · ${m.via}` : ""}` : cur.name} · {when(m.at)}</div>
                  </div>
                ))}
                {!cur.thread.length && <p className="text-xs text-muted-foreground">No message from the shopper.</p>}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Set price on the product (AED)</label>
                    <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-36 h-9" placeholder={cur.quoted_price != null ? String(cur.quoted_price) : "0.00"} />
                  </div>
                  <Button size="sm" variant="outline" disabled={busy || !price} onClick={async () => { if (await send({ price })) setPrice(""); }}>Save price</Button>
                </div>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder={`Hi ${cur.name}, the price of ${cur.product_name} is ...`} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy || !reply.trim()} onClick={async () => { if (await send({ reply, ...(price ? { price } : {}), via: cur.email ? "email" : "note" })) { setReply(""); setPrice(""); } }}>
                    {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{cur.email ? "Send by email" : "Save reply"}{price ? " + set price" : ""}
                  </Button>
                  {waReply && (
                    <a href={waReply} target="_blank" rel="noopener noreferrer"
                      onClick={() => { if (reply.trim()) send({ reply, ...(price ? { price } : {}), via: "whatsapp" }).then((ok) => { if (ok) { setReply(""); setPrice(""); } }); }}
                      className="inline-flex items-center h-9 px-3 rounded-md bg-[#25D366] text-white text-sm font-medium">
                      <MessageCircle className="w-4 h-4 mr-1.5" /> Reply on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
