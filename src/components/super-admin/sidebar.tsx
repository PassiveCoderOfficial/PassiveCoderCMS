"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Globe, CreditCard, Users, TicketIcon,
  Settings, Settings2, Edit3, LogOut, ShieldCheck, Zap, Plus, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview",        href: "/super-admin",              icon: LayoutDashboard, exact: true },
  { label: "All Sites",       href: "/super-admin/sites",        icon: Globe,           add: "/super-admin/sites/new" },
  { label: "Subscriptions",   href: "/super-admin/subscriptions",icon: CreditCard,    add: "/super-admin/subscriptions/new" },
  { label: "Plans & Pricing", href: "/super-admin/plans",        icon: CreditCard,      add: "/super-admin/plans/new" },
  { label: "Support Tickets", href: "/super-admin/tickets",      icon: TicketIcon },
  { label: "Departments",     href: "/super-admin/departments",  icon: Settings2 },
  { label: "Users & Roles",   href: "/super-admin/users",        icon: Users,           add: "/super-admin/users/new" },
  { label: "Agents",          href: "/super-admin/agents",       icon: Zap },
  { label: "Homepage Editor", href: "/super-admin/homepage",     icon: Edit3 },
  { label: "Settings",        href: "/super-admin/settings",     icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="h-14 flex items-center justify-between gap-2.5 px-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-sm text-white">Super Admin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <div key={item.href} className="flex items-center gap-1">
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex flex-1 items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
              {item.add && (
                <Link
                  href={item.add}
                  onClick={onClose}
                  title="Add new"
                  className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-800 hover:text-gray-300 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800 space-y-1">
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex flex-1 items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Site Admin
          </Link>
          <Link
            href="/api/auth/signout"
            title="Sign Out"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-800 hover:text-red-400 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}

export default function SuperAdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3.5 left-3 z-40 p-2 rounded-md bg-gray-900 border border-gray-700 shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-300" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-56 border-r border-gray-800 bg-gray-900 transition-transform duration-200 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarContent onClose={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-gray-800 bg-gray-900 flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
