"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Globe, CreditCard, Users, TicketIcon,
  Settings, Settings2, Edit3, LogOut, ShieldCheck, Zap, Plus, Menu, X, FileText, ChevronDown, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  add?: string;
  children?: { label: string; href: string; icon: React.ElementType; add?: string }[];
}

const NAV: NavItem[] = [
  { label: "Overview",        href: "/super-admin",              icon: LayoutDashboard, exact: true },
  { label: "All Sites",       href: "/super-admin/sites",        icon: Globe,           add: "/super-admin/sites/new" },
  { label: "Subscriptions",   href: "/super-admin/subscriptions",icon: CreditCard,      add: "/super-admin/subscriptions/new" },
  { label: "Billing",         href: "/super-admin/billing",      icon: Receipt },
  { label: "Plans & Pricing", href: "/super-admin/plans",        icon: CreditCard,      add: "/super-admin/plans/new" },
  {
    label: "Support Tickets",
    href: "/super-admin/tickets",
    icon: TicketIcon,
    add: "/super-admin/tickets/new",
    children: [
      { label: "Departments", href: "/super-admin/departments", icon: Settings2 },
    ],
  },
  { label: "Users & Roles",   href: "/super-admin/users",        icon: Users,           add: "/super-admin/users/new" },
  { label: "Agents",          href: "/super-admin/agents",       icon: Zap,             add: "/super-admin/agents/new" },
  { label: "Homepage Editor", href: "/super-admin/homepage",     icon: Edit3 },
  { label: "Root Pages",      href: "/super-admin/root-pages",   icon: FileText,        add: "/super-admin/root-pages/new" },
  { label: "Settings",        href: "/super-admin/settings",     icon: Settings },
];

function NavItemRow({ item, onClose }: { item: NavItem; onClose?: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const childActive = item.children?.some(c => pathname.startsWith(c.href));
  const [expanded, setExpanded] = useState(childActive ?? false);

  return (
    <div>
      <div className="flex items-center gap-1">
        <Link
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex flex-1 items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
            active && !childActive
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {item.label}
          {item.children && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setExpanded(v => !v); }}
              className="ml-auto p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <ChevronDown className={cn("w-3 h-3 transition-transform", expanded ? "rotate-180" : "")} />
            </button>
          )}
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

      {/* Sub-items */}
      {item.children && (expanded || childActive) && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-800 pl-3">
          {item.children.map(child => {
            const cActive = pathname.startsWith(child.href);
            return (
              <div key={child.href} className="flex items-center gap-1">
                <Link
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    "flex flex-1 items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                    cActive
                      ? "bg-indigo-600/80 text-white"
                      : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                  )}
                >
                  <child.icon className="w-3.5 h-3.5 shrink-0" />
                  {child.label}
                </Link>
                {child.add && (
                  <Link href={child.add} onClick={onClose} title="Add new"
                    className="p-1 rounded-lg text-gray-600 hover:bg-gray-800 hover:text-gray-300 transition-colors shrink-0">
                    <Plus className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
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
        {NAV.map(item => (
          <NavItemRow key={item.href} item={item} onClose={onClose} />
        ))}
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
          <button
            onClick={() => { window.location.href = "/api/auth/signout"; }}
            title="Sign Out"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-800 hover:text-red-400 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function SuperAdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3.5 left-3 z-40 p-2 rounded-md bg-gray-900 border border-gray-700 shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-300" />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-56 border-r border-gray-800 bg-gray-900 transition-transform duration-200 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarContent onClose={() => setOpen(false)} />
      </aside>

      <aside className="hidden lg:flex w-56 flex-col border-r border-gray-800 bg-gray-900 flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
