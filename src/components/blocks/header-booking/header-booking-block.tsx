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
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-opacity hover:opacity-90 shrink-0",
        "px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm",
        data.variant === "outline" ? "border-2 border-primary text-primary" : "text-primary-foreground",
      )}
      style={data.variant === "solid"
        ? { backgroundColor: "hsl(var(--primary))" }
        : data.variant === "outline"
          ? undefined
          : { backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))" }}
    >
      <CalendarCheck className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden />
      {data.label || "Book now"}
    </Link>
  );
}
