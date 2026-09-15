"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "./nav-items";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, ShieldCheck, LogOut, Zap, MessageCircle, X, Store } from "lucide-react";
import type { ModuleKey } from "./nav-items";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isSaaS } from "@/lib/flags";
import { Shell } from "@/components/admin-shell/sidebar";
import type { ShellNavItem } from "@/components/admin-shell/types";

// Routes where the full-width page builder needs the sidebar out of the way by
// default. Still user-togglable via the rail button — this only sets the
// initial state per route.
const BUILDER_ROUTE = /^\/dashboard\/pages\/[^/]+$/;

function AdminHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-14 items-center justify-between px-4 border-b gap-2">
      <a href="https://passivecoder.com" target="_blank" rel="noopener noreferrer" className="flex items-center min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png"
          alt="Passive Coder"
          className="h-7 w-auto"
        />
      </a>
      <div className="flex items-center gap-1 shrink-0">
        {/* href="/" resolves relative to the current tenant subdomain, so this
            always opens that tenant's own live homepage — not passivecoder.com. */}
        <Link
          href="/"
          target="_blank"
          title="Visit Site"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AdminFooter({ isSuperAdmin, isStaff, isVendor }: { isSuperAdmin: boolean; isStaff: boolean; isVendor: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <Separator />
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1">
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-indigo-500 hover:bg-accent hover:text-indigo-400 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Super Admin Panel
            </Link>
          )}
          {isStaff && !isSuperAdmin && (
            <a
              href={`${typeof window !== "undefined" && window.location.hostname.includes("localhost") ? "http" : "https"}://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com"}/staff`}
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-yellow-500 hover:bg-accent hover:text-yellow-400 transition-colors"
            >
              <Zap className="h-4 w-4 shrink-0" />
              Staff Portal
            </a>
          )}
          {isVendor && !isSuperAdmin && !isStaff && (
            <Link
              href="/vendor/dashboard"
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-emerald-600 hover:bg-accent hover:text-emerald-500 transition-colors"
            >
              <Store className="h-4 w-4 shrink-0" />
              Seller Centre
            </Link>
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
        <p className="text-[10px] text-muted-foreground text-center pt-1">Passive Coder v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"}</p>
      </div>
    </>
  );
}

export function AdminSidebar({ isSuperAdmin = false, isStaff = false, isVendor = false, enabledModules }: {
  isSuperAdmin?: boolean; isStaff?: boolean; isVendor?: boolean; enabledModules?: Record<ModuleKey, boolean>;
}) {
  const pathname = usePathname();
  const isBuilderRoute = BUILDER_ROUTE.test(pathname) && pathname !== "/dashboard/pages/new";

  return (
    <Shell
      theme="light"
      sections={navSections}
      defaultCollapsed={isBuilderRoute}
      header={(onClose) => <AdminHeader onClose={onClose} />}
      footer={<AdminFooter isSuperAdmin={isSuperAdmin} isStaff={isStaff} isVendor={isVendor} />}
      filterItem={(item: ShellNavItem) => {
        if (item.saasOnly && !isSaaS) return false;
        if (item.standaloneOnly && isSaaS) return false;
        // enabledModules is undefined for super admins (bypass) — only gate
        // when it's actually resolved (regular tenants/agents).
        if (item.moduleKey && enabledModules && !enabledModules[item.moduleKey as ModuleKey]) return false;
        return true;
      }}
    />
  );
}
