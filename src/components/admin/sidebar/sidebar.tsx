"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navSections } from "./nav-items";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import { isSaaS } from "@/lib/flags";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">C</span>
        </div>
        <span className="font-semibold text-sm">CMS Studio</span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1">
        <nav className="px-2 py-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.filter((item) => {
                  if (item.saasOnly && !isSaaS) return false;
                  if (item.standaloneOnly && isSaaS) return false;
                  return true;
                }).map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href) && item.href !== "/";
                  const isExternal = item.href === "/";
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        target={isExternal ? "_blank" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isExternal && <ExternalLink className="h-3 w-3 opacity-50" />}
                        {item.badge && (
                          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-3">
        <p className="text-[10px] text-muted-foreground text-center">CMS Studio v1.0.0</p>
      </div>
    </aside>
  );
}
