"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navSections } from "./nav-items";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, ShieldCheck, Menu, X, LogOut, Zap, MessageCircle, ChevronDown } from "lucide-react";
import type { NavItem } from "./nav-items";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isSaaS } from "@/lib/flags";

function NavLinkItem({ item, pathname, onClose }: { item: NavItem; pathname: string; onClose?: () => void }) {
  const isExternal = item.href === "/";
  const hasChildren = (item.children?.length ?? 0) > 0;

  // A child route is "within" this item if pathname matches the parent base
  const withinParent = pathname.startsWith(item.href) && item.href !== "/";
  const [expanded, setExpanded] = useState(withinParent);

  const isActive =
    item.href === "/dashboard"
      ? pathname === item.href
      : hasChildren
        ? pathname === item.href // parent only "active" on its own exact page
        : withinParent;

  if (hasChildren) {
    return (
      <li>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer",
            withinParent && !expanded
              ? "bg-accent/50 text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </div>
        {expanded && (
          <ul className="mt-0.5 ml-3 pl-2 border-l border-border space-y-0.5">
            {item.children!.map((child) => {
              const childActive = pathname === child.href;
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      childActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <child.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{child.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        target={isExternal ? "_blank" : undefined}
        onClick={onClose}
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
}

function SidebarContent({ isSuperAdmin, isAgent, onClose }: { isSuperAdmin: boolean; isAgent: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b">
        <a href="https://passivecoder.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png"
            alt="Passive Coder"
            className="h-7 w-auto"
          />
        </a>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
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
                }).map((item) => (
                  <NavLinkItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1">
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              onClick={onClose}
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-indigo-500 hover:bg-accent hover:text-indigo-400 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Super Admin Panel
            </Link>
          )}
          {isAgent && !isSuperAdmin && (
            <a
              href={`${typeof window !== "undefined" && window.location.hostname.includes("localhost") ? "http" : "https"}://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com"}/agent`}
              onClick={onClose}
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-yellow-500 hover:bg-accent hover:text-yellow-400 transition-colors"
            >
              <Zap className="h-4 w-4 shrink-0" />
              Staff Portal
            </a>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <a
          href="https://wa.me/8801678669699?text=Hi%2C%20I%20need%20support%20with%20my%20Passive%20Coder%20site."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full rounded-md py-2 px-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors shadow-sm"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp Support
        </a>
        <p className="text-[10px] text-muted-foreground text-center pt-1">Passive Coder v1.0.0</p>
      </div>
    </>
  );
}

export function AdminSidebar({ isSuperAdmin = false, isAgent = false }: { isSuperAdmin?: boolean; isAgent?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger — shown in topbar via this exported button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3.5 left-3 z-40 p-2 rounded-md bg-background border shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-60 border-r bg-sidebar transition-transform duration-200 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarContent isSuperAdmin={isSuperAdmin} isAgent={isAgent} onClose={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex h-screen w-60 flex-col border-r bg-sidebar flex-shrink-0">
        <SidebarContent isSuperAdmin={isSuperAdmin} isAgent={isAgent} />
      </aside>
    </>
  );
}
