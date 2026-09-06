"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { customerLogoutAction } from "./actions";

const TABS = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/wishlist", label: "Wishlist" },
] as const;

/** Shared tab nav across the three /account pages, so a customer can move
 *  between orders/profile/wishlist without going back through the site nav. */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between border-b mb-8">
      <div className="flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              pathname === t.href
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <form action={customerLogoutAction}>
        <button type="submit" className="text-sm text-muted-foreground hover:text-foreground underline mb-3">
          Sign out
        </button>
      </form>
    </div>
  );
}
