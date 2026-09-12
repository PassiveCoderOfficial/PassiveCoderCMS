"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { setDineInTableToken } from "@/lib/dine-in/table-context";

interface Props {
  qrToken: string;
  tableNumber: string;
  branchName: string;
}

/**
 * Stashes the scanned table's token, then moves on to the menu. Split from
 * page.tsx because sessionStorage only exists client-side, while the token
 * itself needs a server-side validity check before anything is shown or
 * stored (page.tsx does that check).
 */
export function TableLanding({ qrToken, tableNumber, branchName }: Props) {
  const router = useRouter();

  useEffect(() => {
    setDineInTableToken(qrToken);
    // Not /shop — that route is the multi-vendor marketplace listing and a
    // single-restaurant tenant (the only kind with tables) doesn't have
    // one. A restaurant's menu is a page they built with the ecommerce
    // products block, most reliably linked from their own home page, so
    // that's the safe landing spot rather than guessing a menu page slug.
    router.replace("/");
  }, [qrToken, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-semibold">{branchName}</p>
        <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading the menu…</p>
    </div>
  );
}
