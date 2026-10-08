import React from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeaderBookingBlockProps } from "@/types/cms";

/**
 * Header builder "Booking button": opens the site's booking page (/book,
 * built into every site). Unlike the generic header Button it stays visible
 * on phones (as a compact pill), since booking is the action most visitors
 * come for.
 */
export function HeaderBookingBlock({ block }: { block: HeaderBookingBlockProps }) {
  const { data } = block;
  return (
    <Link
      href={data.url || "/book"}
      aria-label={data.label || "Book now"}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-opacity hover:opacity-90 shrink-0",
        "px-2.5 py-2 min-[420px]:px-3 min-[420px]:py-1.5 text-xs md:px-4 md:py-2 md:text-sm",
        data.variant === "outline" ? "border-2 border-primary text-primary" : "text-primary-foreground",
      )}
      style={data.variant === "solid"
        ? { backgroundColor: "hsl(var(--primary))" }
        : data.variant === "outline"
          ? undefined
          : { backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))" }}
    >
      <CalendarCheck className="w-4 h-4" aria-hidden />
      {/* Icon-only on narrow phones: logo + wordmark + hamburger + a full
          label pill overflowed a 390px header row. */}
      <span className="hidden min-[420px]:inline">{data.label || "Book now"}</span>
    </Link>
  );
}
