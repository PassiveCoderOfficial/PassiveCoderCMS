"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Camera, Star } from "lucide-react";
import type { TestimonialsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

type D = TestimonialsBlockProps["data"];

const MAX_PHOTOS = 5;
const LABELS = ["", "1 star", "2 stars", "3 stars", "4 stars", "5 stars"];

/**
 * "Give your rating" form beside a score summary, above the review cards.
 * Posts to /api/testimonials/submit into the block's testimonial group; the
 * new review shows straight away in this page (and on reload when the site
 * publishes reviews instantly, or once the owner approves it).
 */
export function ReviewBoard({ data, onAdded }: { data: D; onAdded: (item: D["items"][number]) => void }) {
  const form = data.reviewForm ?? {};
  const items = data.items ?? [];
  const rated = items.filter((i) => i.rating);
  const avg = data._stats?.avg ?? (rated.length ? rated.reduce((a, i) => a + (i.rating ?? 0), 0) / rated.length : 0);
  const count = data._stats?.count ?? items.length;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [text, setText] = useState("");
  const [trap, setTrap] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const next = [...photos];
    for (const f of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
      const fd = new FormData(); fd.append("file", f);
      const res = await fetch("/api/store-reviews/upload", { method: "POST", body: fd }).catch(() => null);
      const j = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok && j.url) next.push(j.url);
      else setState({ kind: "err", msg: j.error || "A photo could not be uploaded." });
    }
    setPhotos(next); setUploading(false);
  };
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "err"; msg?: string }>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setState({ kind: "err", msg: "Please select your star rating first." }); return; }
    if (!data.source_group_id) { setState({ kind: "err", msg: "Reviews are not set up yet." }); return; }
    setState({ kind: "busy" });
    const res = await fetch("/api/testimonials/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: data.source_group_id, name, location: place, rating, content: text, website: trap, photos }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) { setState({ kind: "err", msg: json.error || "Could not send your review. Please try again." }); return; }
    onAdded({ id: `new-${Date.now()}`, name: name.trim(), role: place.trim() || undefined, content: text.trim(), rating, photos: photos.length ? photos : undefined });
    setRating(0); setName(""); setPlace(""); setText(""); setPhotos([]);
    setState({ kind: "ok", msg: json.published ? (form.thanksText || "Thank you! Your review has been added.") : (form.pendingText || "Thank you! Your review will appear once approved.") });
  };

  const shown = hover || rating;
  return (
    <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-6 items-start mb-8 text-left">
      <form onSubmit={submit} className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm">
        <h3 className="text-xl font-black text-primary">{form.title || "Give Your Rating"}</h3>
        {form.text && <p className="text-sm text-muted-foreground mt-2">{form.text}</p>}
        <div className="flex gap-2 mt-5" role="radiogroup" aria-label="Star rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={LABELS[n]}
              onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
              <Star className={cn("h-9 w-9", n <= shown ? "text-accent fill-accent" : "text-muted-foreground/30 fill-muted-foreground/10")} />
            </button>
          ))}
        </div>
        <p className="text-sm font-bold text-accent mt-2">{rating ? `${LABELS[rating]} selected` : (form.promptText || "Please select a rating")}</p>
        <div className="mt-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder={form.namePlaceholder || "Your Name"} className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40" />
          <input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={60} placeholder={form.placePlaceholder || "Area (optional), e.g. Tampines"} className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} required maxLength={600} rows={4} placeholder={form.textPlaceholder || "Write your review..."} className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40" />
          <div>
            <div className="flex flex-wrap gap-2">
              {photos.map((u) => (
                <span key={u} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => setPhotos((a) => a.filter((x) => x !== u))} className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-black/70 text-xs leading-none text-white">×</button>
                </span>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted">
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px]">{uploading ? "..." : "Add"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={uploading} onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{form.photosText || <>Add up to {MAX_PHOTOS} photos of the work (optional).</>}</p>
          </div>
          <input value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" name="website" />
          <button type="submit" disabled={state.kind === "busy" || uploading} className="w-full rounded-xl bg-accent py-3 font-black text-accent-foreground disabled:opacity-60">
            {state.kind === "busy" ? "Sending..." : form.buttonLabel || "Submit Review"}
          </button>
        </div>
        {state.msg && <p className={cn("text-sm font-semibold mt-3", state.kind === "ok" ? "text-green-600" : "text-red-600")}>{state.msg}</p>}
      </form>
      <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-4xl font-black text-primary">{avg ? avg.toFixed(1) : "5.0"}</div>
          <div className="flex gap-0.5 mt-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-5 w-5", n <= Math.round(avg || 5) ? "text-accent fill-accent" : "text-muted fill-muted")} />)}</div>
          <div className="text-xs text-muted-foreground mt-1">{form.countLabel ? form.countLabel.replace(/\{count\}/g, String(count)) : <>{count} customer review{count === 1 ? "" : "s"}</>}</div>
        </div>
        {form.ctaLabel && form.ctaUrl && (
          <Link href={form.ctaUrl} className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground">{form.ctaLabel}</Link>
        )}
      </div>
    </div>
  );
}
