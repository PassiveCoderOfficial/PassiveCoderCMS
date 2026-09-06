import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { HeaderCtaBlockProps } from "@/types/cms";

/**
 * Independent header sub-block: a single call-to-action button. Deliberately
 * a distinct block type from the existing "cta" block (a full-width
 * announcement banner already offered in headers, relabeled "Announcement
 * Bar" there) — this is a single inline button, closer in shape to hero's
 * primaryButton field. Named "header_cta" to avoid colliding with the
 * existing type. One shared component (editor + site) — purely
 * presentational, same pattern as divider/spacer.
 */
export function HeaderCtaBlock({ block }: { block: HeaderCtaBlockProps }) {
  const { data } = block;

  return (
    <Link
      href={data.url || "#"}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 shrink-0",
        data.variant === "outline"
          ? "border-2 border-primary text-primary"
          : "text-primary-foreground",
      )}
      style={data.variant === "gradient"
        ? { backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))" }
        : data.variant !== "outline"
          ? { backgroundColor: "hsl(var(--primary))" }
          : undefined}
    >
      {data.label || "Get Started"}
    </Link>
  );
}
