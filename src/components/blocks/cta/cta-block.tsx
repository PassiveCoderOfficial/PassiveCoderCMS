import React from "react";
import type { CTABlockProps } from "@/types/cms";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CTABlock({ block }: { block: CTABlockProps }) {
  const { data } = block;
  const { title, description, primaryButton, secondaryButton, layout } = data;

  return (
    <div className={cn("max-w-5xl mx-auto", layout === "split" && "flex items-center justify-between gap-8 flex-wrap")}>
      <div className={cn("flex flex-col gap-3", layout !== "split" && "text-center items-center")}>
        <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
        {description && <p className="text-white/80 text-lg max-w-xl">{description}</p>}
      </div>
      {(primaryButton || secondaryButton) && (
        <div className={cn("flex gap-3 flex-wrap", layout !== "split" && "justify-center mt-4")}>
          {primaryButton && (
            <Link href={primaryButton.url} className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              {primaryButton.label}
            </Link>
          )}
          {secondaryButton && (
            <Link href={secondaryButton.url} className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
              {secondaryButton.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
