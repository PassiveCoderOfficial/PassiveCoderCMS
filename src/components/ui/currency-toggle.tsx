"use client";

import { cn } from "@/lib/utils";
import type { Currency } from "@/lib/hooks/use-currency";

export function CurrencyToggle({ currency, onChange, className }: {
  currency: Currency;
  onChange: (c: Currency) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 bg-muted rounded-full p-1 text-sm font-medium", className)}>
      <button
        onClick={() => onChange("USD")}
        className={cn(
          "px-3 py-1 rounded-full transition-all text-xs",
          currency === "USD" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        USD $
      </button>
      <button
        onClick={() => onChange("BDT")}
        className={cn(
          "px-3 py-1 rounded-full transition-all text-xs",
          currency === "BDT" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        BDT ৳
      </button>
    </div>
  );
}
