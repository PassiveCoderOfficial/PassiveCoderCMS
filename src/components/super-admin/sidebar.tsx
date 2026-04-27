"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Globe, CreditCard, Users, TicketIcon,
  Settings, Edit3, LogOut, ShieldCheck, Zap, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview",        href: "/super-admin",              icon: LayoutDashboard, exact: true },
  { label: "All Sites",       href: "/super-admin/sites",        icon: Globe,           add: "/super-admin/sites/new" },
  { label: "Subscriptions",   href: "/super-admin/subscriptions",icon: CreditCard },
  { label: "Plans & Pricing", href: "/super-admin/plans",        icon: CreditCard,      add: "/super-admin/plans/new" },
  { label: "Support Tickets", href: "/super-admin/tickets",      icon: TicketIcon },
  { label: "Users & Roles",   href: "/super-admin/users",        icon: Users,           add: "/super-admin/users/new" },
  { label: "Agents",          href: "/super-admin/agents",       icon: Zap },
  { label: "Homepage Editor", href: "/super-admin/homepage",     icon: Edit3 },
  { label: "Settings",        href: "/super-admin/settings",     icon: Settings },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 flex flex-col border-r border-gray-800 bg-gray-900 flex-shrink-0">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-800">
        <ShieldCheck className="w-5 h-5 text-indigo-400" />
        <span className="font-bold text-sm text-white">Super Admin</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <div key={item.href} className="flex items-center gap-1">
              <Link
                href={item.href}
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
                  title={`Add new`}
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
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Site Admin
        </Link>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
