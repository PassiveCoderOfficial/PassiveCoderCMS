"use client";

/**
 * A menu as a plain list of links: for footer columns, sidebars and legal
 * rows (Header & Footer Studio). The footer studio (phase 3) renders a column
 * that points at a menu with this; nothing uses it on live sites yet, so it
 * cannot change any existing footer.
 *
 * Mega menus and dropdowns flatten to links (menuToLinks); `levels` sets how
 * deep it goes. Device visibility is CSS-driven (the server cannot know the
 * viewport): desktop-only links hide below md, phone-only links from md up,
 * the same breakpoint the header uses for its menu bar and drawer.
 */
import React from "react";
import Link from "next/link";
import type { NavItem } from "@/types/cms";
import { cn } from "@/lib/utils";
import { hrefFor, useAlternates } from "@/components/site/use-alternates";
import { filterForAudience, hasAudience, menuToLinks } from "@/modules/navigation/menu-model";
import { useSignedIn } from "@/components/site/use-signed-in";
import { NavBadge, NavIcon } from "./nav-menu-studio";

export function MenuLinkList({ items, levels = 1, className, linkClassName, linkStyle }: {
  items: NavItem[];
  levels?: number;
  className?: string;
  linkClassName?: string;
  linkStyle?: React.CSSProperties;
}) {
  const alts = useAlternates();
  // Guest-only / customer-only links (menus P1), decided in the browser.
  const signedIn = useSignedIn(hasAudience(items));
  const links = menuToLinks(filterForAudience(items, signedIn), { levels });
  if (!links.length) return null;
  return (
    <ul className={cn("space-y-2", className)}>
      {links.map((l) => (
        <li key={l.id} className={cn(l.device === "desktop" && "hidden md:list-item", l.device === "mobile" && "md:hidden", l.depth > 0 && "ps-3")}>
          <Link href={hrefFor(l, alts)} target={l.target} className={cn("inline-flex items-center gap-1.5 text-sm hover:underline", linkClassName)} style={linkStyle}>
            {l.icon && <NavIcon name={l.icon} />}
            {l.label}
            <NavBadge text={l.badge} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
