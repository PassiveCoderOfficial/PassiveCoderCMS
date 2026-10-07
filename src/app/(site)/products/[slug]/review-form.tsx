"use client";

import React, { useState } from "react";
import { Star, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Write-a-review form on the product page. Reviews wait for store approval. */
export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", body: "", website: "" });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/store-reviews/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Upload failed"); else setImages((x) => [...x, data.url].slice(0, 4));
    } finally { setUploading(false); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast.error("Choose a star rating"); return; }
    setSending(true);
    const res = await fetch("/api/store-reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: productId, rating, images, ...form }) });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) { toast.error(data.error ?? "Could not send your review"); return; }
    setDone(true);
  };

  if (done) return <p className="text-sm bg-muted/60 rounded p-3">Thank you. Your review will appear once the store has checked it.</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="px-6 py-2.5 rounded-full border border-foreground text-sm uppercase tracking-wide hover:bg-foreground hover:text-background transition-colors">Write a review</button>;

  const input = "w-full border rounded px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} stars`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}>
            <Star className="w-7 h-7" style={{ color: "#D4A72C", fill: n <= (hover || rating) ? "#D4A72C" : "transparent" }} strokeWidth={1.4} />
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input required className={input} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" className={input} placeholder="Email (not shown)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <textarea required rows={4} className={input} placeholder="What did you think of it?" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <input tabIndex={-1} autoComplete="off" className="hidden" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden />
      <div className="flex flex-wrap gap-2 items-center">
        {images.map((u) => (
          <div key={u} className="relative w-16 h-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="w-16 h-16 object-cover rounded border" />
            <button type="button" aria-label="Remove photo" onClick={() => setImages((x) => x.filter((y) => y !== u))} className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5"><X className="w-3 h-3" /></button>
          </div>
        ))}
        {images.length < 4 && (
          <label className="flex items-center gap-1.5 border border-dashed rounded px-3 py-2 text-xs cursor-pointer hover:bg-muted">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Add photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <button disabled={sending} className="px-7 py-2.5 rounded-full text-sm uppercase tracking-wide disabled:opacity-60" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
        {sending ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
