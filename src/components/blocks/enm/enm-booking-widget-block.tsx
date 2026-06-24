import React from "react";
import type { EnmBookingWidgetBlockProps } from "@/types/cms";

export function EnmBookingWidgetBlock({ block }: { block: EnmBookingWidgetBlockProps }) {
  const { data } = block;
  if (!data.expertSlug) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl text-muted-foreground text-sm">
        <p className="font-medium">ENM Booking Widget</p>
        <p className="text-xs mt-1">Set an expert slug in block settings</p>
      </div>
    );
  }

  const src = `https://expertnear.me/widget/${data.expertSlug}`;
  const height = data.height ?? 600;
  const maxWidth = data.maxWidth ?? 400;
  const borderRadius = data.borderRadius ?? 12;

  return (
    <div className="mx-auto" style={{ maxWidth }}>
      {data.label && (
        <p className="text-sm font-semibold mb-3 text-center">{data.label}</p>
      )}
      <iframe
        src={src}
        width="100%"
        height={height}
        style={{ border: "none", borderRadius, display: "block" }}
        loading="lazy"
        title="Book a session"
      />
    </div>
  );
}
