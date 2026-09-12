"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { getDineInTableToken } from "@/lib/dine-in/table-context";

/**
 * Small persistent "You're ordering for Table N" indicator, shown on every
 * page while a scanned table token is active for this visit.
 *
 * Without this, scanning the QR code silently redirected to the homepage
 * with no visible sign anything happened — a customer had no way to tell
 * their scan "worked" until they reached checkout and saw dine-in already
 * selected, several steps later. Reads sessionStorage directly rather than
 * the table's real name/number (which would need a server round trip just
 * to render one badge) — "you scanned a table" is the whole message this
 * needs to convey.
 */
export function DineInBadge() {
  const [hasTable, setHasTable] = useState(false);

  useEffect(() => {
    setHasTable(!!getDineInTableToken());
  }, []);

  if (!hasTable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-1.5 rounded-full bg-foreground text-background px-3.5 py-2 text-xs font-medium shadow-lg">
      <UtensilsCrossed className="h-3.5 w-3.5" />
      Ordering for your table — dine-in selected at checkout
    </div>
  );
}
