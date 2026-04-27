import React from "react";
import type { EmbedBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

function getEmbedSrc(url: string, embedType: string, autoplay?: boolean): string {
  if (embedType === "youtube") {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    const id = match?.[1] ?? url;
    return `https://www.youtube.com/embed/${id}${autoplay ? "?autoplay=1&mute=1" : ""}`;
  }
  if (embedType === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    const id = match?.[1] ?? url;
    return `https://player.vimeo.com/video/${id}${autoplay ? "?autoplay=1&muted=1" : ""}`;
  }
  return url;
}

const ASPECT_RATIO_CLASS: Record<string, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

export function EmbedBlock({ block }: { block: EmbedBlockProps }) {
  const { data } = block;

  if (!data.url) {
    return (
      <div className="max-w-4xl mx-auto border-2 border-dashed rounded-xl flex items-center justify-center py-16 text-muted-foreground text-sm">
        Enter an embed URL in the settings panel
      </div>
    );
  }

  const src = getEmbedSrc(data.url, data.embedType, data.autoplay);

  return (
    <div className="max-w-4xl mx-auto">
      <div className={cn("w-full rounded-xl overflow-hidden", ASPECT_RATIO_CLASS[data.aspectRatio] ?? "aspect-video")}>
        <iframe
          src={src}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
      {data.caption && <p className="text-sm text-muted-foreground text-center mt-3">{data.caption}</p>}
    </div>
  );
}
