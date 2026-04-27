import React from "react";
import type { VideoBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

function getVideoSrc(url: string, type: string, autoplay: boolean, muted: boolean, loop: boolean): string {
  if (type === "youtube") {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    const id = match?.[1] ?? url;
    const params = new URLSearchParams();
    if (autoplay) { params.set("autoplay", "1"); params.set("mute", "1"); }
    if (loop) { params.set("loop", "1"); params.set("playlist", id); }
    params.set("rel", "0");
    return `https://www.youtube.com/embed/${id}?${params}`;
  }
  if (type === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    const id = match?.[1] ?? url;
    const params = new URLSearchParams();
    if (autoplay) { params.set("autoplay", "1"); params.set("muted", "1"); }
    if (loop) params.set("loop", "1");
    return `https://player.vimeo.com/video/${id}?${params}`;
  }
  return url;
}

const ASPECT_CLASS: Record<string, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
};

export function VideoBlock({ block }: { block: VideoBlockProps }) {
  const { data } = block;

  if (!data.url) {
    return (
      <div className="max-w-4xl mx-auto border-2 border-dashed rounded-xl flex items-center justify-center py-16 text-muted-foreground text-sm">
        Enter a video URL in the settings panel
      </div>
    );
  }

  const containerStyle = data.maxWidth ? { maxWidth: data.maxWidth } : {};

  return (
    <div className="mx-auto" style={containerStyle}>
      {data.videoType === "mp4" ? (
        <div className={cn("w-full rounded-xl overflow-hidden", ASPECT_CLASS[data.aspectRatio] ?? "aspect-video")}>
          <video
            src={data.url}
            poster={data.poster}
            autoPlay={data.autoplay}
            muted={data.muted}
            loop={data.loop}
            controls={data.controls}
            className="w-full h-full object-cover"
            playsInline
          />
        </div>
      ) : (
        <div className={cn("w-full rounded-xl overflow-hidden", ASPECT_CLASS[data.aspectRatio] ?? "aspect-video")}>
          <iframe
            src={getVideoSrc(data.url, data.videoType, data.autoplay, data.muted, data.loop)}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}
      {data.caption && <p className="text-sm text-muted-foreground text-center mt-3">{data.caption}</p>}
    </div>
  );
}
