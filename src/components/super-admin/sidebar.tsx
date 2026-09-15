"use client";

import Link from "next/link";
import {
  LayoutDashboard, Globe, CreditCard, Users, TicketIcon,
  Settings, Settings2, Edit3, LogOut, ShieldCheck, Zap, FileText, Receipt,
  LayoutTemplate, Sparkles, X,
} from "lucide-react";
import { Shell } from "@/components/admin-shell/sidebar";
import type { ShellNavSection } from "@/components/admin-shell/types";

const SA_SECTIONS: ShellNavSection[] = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "/super-admin", icon: LayoutDashboard, exact: true },
      { label: "All Sites", href: "/super-admin/sites", icon: Globe, add: "/super-admin/sites/new" },
      { label: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard, add: "/super-admin/subscriptions/new" },
      { label: "Billing", href: "/super-admin/billing", icon: Receipt },
      {
        label: "Plans & Pricing", href: "/super-admin/plans", icon: CreditCard, add: "/super-admin/plans/new",
        children: [{ label: "AiCoder Packages", href: "/super-admin/aicoder-packages", icon: Sparkles }],
      },
      {
        label: "Support Tickets", href: "/super-admin/tickets", icon: TicketIcon, add: "/super-admin/tickets/new",
        children: [{ label: "Departments", href: "/super-admin/departments", icon: Settings2 }],
      },
      { label: "Users & Roles", href: "/super-admin/users", icon: Users, add: "/super-admin/users/new" },
      { label: "Staff", href: "/super-admin/agents", icon: Zap, add: "/super-admin/agents/new" },
      { label: "Homepage Editor", href: "/super-admin/homepage", icon: Edit3 },
      { label: "Root Pages", href: "/super-admin/root-pages", icon: FileText, add: "/super-admin/root-pages/new" },
      {
        label: "My Templates", href: "/super-admin/my-templates", icon: LayoutTemplate, add: "/super-admin/my-templates/new",
        children: [{ label: "Categories", href: "/super-admin/my-templates/categories", icon: Settings2 }],
      },
      { label: "Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

// Manager-only nav — their own staff data, merged into the SA panel instead
// of a separate portal, per "one dashboard combining SA + staff elements".
const MANAGER_SECTION: ShellNavSection = {
  label: "My Staff Account",
  items: [
    { label: "My Sites", href: "/staff/sites", icon: Globe },
    { label: "Commissions", href: "/staff/commissions", icon: CreditCard },
    { label: "My Profile", href: "/staff/profile", icon: Users },
  ],
};

function SAHeader({ isSA, onClose }: { isSA: boolean; onClose?: () => void }) {
  return (
    <div className="h-14 flex items-center justify-between gap-2.5 px-4 border-b border-gray-800">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-indigo-400" />
        <span className="font-bold text-sm text-white">{isSA ? "Super Admin" : "Manager"}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="lg:hidden p-1 text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function SAFooter() {
  return (
    <div className="p-3 border-t border-gray-800 space-y-1">
      <div className="flex items-center gap-1">
        <Link
          href="/dashboard"
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
  );
}

export default function SuperAdminSidebar({ isSA = true }: { isSA?: boolean }) {
  const sections = isSA ? SA_SECTIONS : [...SA_SECTIONS, MANAGER_SECTION];

  return (
    <Shell
      theme="dark"
      width="w-56"
      sections={sections}
      header={(onClose) => <SAHeader isSA={isSA} onClose={onClose} />}
      footer={<SAFooter />}
    />
  );
}
