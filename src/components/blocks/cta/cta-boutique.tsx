import React from "react";
import type { CTABlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { BqLink, bqStyle } from "@/components/blocks/_primitives/boutique";

/**
 * Boutique Banner: small spaced-out label, serif title, optional text and pill
 * buttons, all centred. The photo and its overlay are the section's own
 * Background (image + overlay colour) and height comes from the Style panel,
 * so a client swaps the picture without touching the copy. "Text at top"
 * pins the copy to the top edge (poster-style banners).
 */
export function CTABoutiqueBanner({ data }: { data: CTABlockProps["data"] }) {
  const light = data.tone !== "dark";
  return (
    <div className={cn("bq w-full flex flex-col items-center text-center px-4", data.contentPosition === "top" ? "justify-start" : "justify-center")}
      style={bqStyle(data.colors, { color: data.colors?.dark ?? (light ? "#fff" : undefined), minHeight: "inherit" })}>
      <div className="max-w-3xl">
        {data.eyebrow && <span className="bq-eyebrow mb-4" style={{ opacity: .9 }}>{data.eyebrow}</span>}
        {data.title && <h2 className="bq-h m-0 text-[26px] sm:text-[34px]">{data.title}</h2>}
        {data.description && <p className="mt-4 mb-0 text-[15px] leading-relaxed opacity-90">{data.description}</p>}
        {(data.primaryButton?.label || data.secondaryButton?.label) && (
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {data.primaryButton?.label && <BqLink href={data.primaryButton.url || "#"} className="bq-btn">{data.primaryButton.label}</BqLink>}
            {data.secondaryButton?.label && (
              <BqLink href={data.secondaryButton.url || "#"} className="bq-btn" style={{ background: "transparent", border: `1px solid ${light ? "#fff" : "currentColor"}`, color: "inherit" }}>{data.secondaryButton.label}</BqLink>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
