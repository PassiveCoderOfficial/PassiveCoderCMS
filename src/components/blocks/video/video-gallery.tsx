"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryVideo { id: string; url: string; title?: string }

/** YouTube / Vimeo id + embed + thumbnail from a pasted link. */
export function videoMeta(url: string): { embed: string; thumb: string | null } {
  const yt = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{6,})/);
  if (yt) return { embed: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { embed: `https://player.vimeo.com/video/${vm[1]}?autoplay=1`, thumb: `https://vumbnail.com/${vm[1]}.jpg` };
  return { embed: url, thumb: null };
}

/** A video that shows its thumbnail until clicked, so a page with six videos
 *  doesn't load six players up front. */
function LazyVideo({ v, className }: { v: GalleryVideo; className?: string }) {
  const [play, setPlay] = useState(false);
  const { embed, thumb } = videoMeta(v.url);
  const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(v.url);
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-xl bg-black", className)}>
      {isFile ? (
        <video src={v.url} controls playsInline className="w-full h-full object-cover" />
      ) : play ? (
        <iframe src={embed} title={v.title || "Video"} className="w-full h-full border-0" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 w-full h-full" aria-label={`Play ${v.title || "video"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb && <img src={thumb} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />}
          <span className="absolute inset-0 grid place-items-center">
            <span className="w-14 h-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xl group-hover:scale-110 transition-transform"><Play className="w-6 h-6 ml-0.5" fill="currentColor" /></span>
          </span>
        </button>
      )}
    </div>
  );
}

/** gallery = grid of video cards; playlist = big player with a list beside it. */
export function VideoGallery({ videos, layout, columns = 3 }: { videos: GalleryVideo[]; layout: "gallery" | "playlist"; columns?: 2 | 3 | 4 }) {
  const list = videos.filter((v) => v.url?.trim());
  const [active, setActive] = useState(0);
  if (!list.length) return <p className="text-center text-sm text-muted-foreground">Add videos in the settings panel.</p>;

  if (layout === "playlist") {
    const cur = list[Math.min(active, list.length - 1)];
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <LazyVideo key={cur.id} v={cur} />
          {cur.title && <p className="mt-3 font-semibold">{cur.title}</p>}
        </div>
        <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {list.map((v, i) => {
            const { thumb } = videoMeta(v.url);
            return (
              <li key={v.id}>
                <button type="button" onClick={() => setActive(i)} className={cn("w-full flex gap-3 items-center rounded-xl p-2 text-left transition-colors", i === active ? "bg-primary/10" : "hover:bg-muted")}>
                  <span className="relative w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />}
                  </span>
                  <span className={cn("text-sm line-clamp-2", i === active && "font-semibold")}>{v.title || `Video ${i + 1}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <div className={cn("grid grid-cols-1 gap-6", cols)}>
      {list.map((v) => (
        <figure key={v.id}>
          <LazyVideo v={v} />
          {v.title && <figcaption className="mt-2.5 text-sm font-medium">{v.title}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
