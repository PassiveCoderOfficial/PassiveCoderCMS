"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, MessageCircle, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { customerLogoutAction } from "./actions";

const TABS = [
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/messages", label: "Messages", icon: MessageCircle },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: User },
] as const;

/** Account header shared by every /account page: title card with icon tabs,
 *  so a customer can hop between orders, chats, wishlist and profile. Uses
 *  theme tokens so it follows each store's brand. */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <div className="rounded-2xl bg-card border mb-4 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-primary/10 to-transparent">
        <span className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <User className="w-5 h-5" />
        </span>
        <div>
          <p className="font-bold text-lg leading-tight">My account</p>
          <p className="text-xs text-muted-foreground">Orders, chats and saved items in one place</p>
        </div>
        <form action={customerLogoutAction} className="ml-auto">
          <button type="submit" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
      <nav className="flex overflow-x-auto border-t [scrollbar-width:none]">
        {TABS.map((t) => {
          const on = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex-1 min-w-[88px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors",
                on ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
