"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pencil, UserCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Floating vertical icon menu shown on the live site to a logged-in admin
 *  of this tenant (or a super admin) — quick jump into the builder for the
 *  page they're currently viewing, without hunting through the dashboard. */
export function AdminEditWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    const slug = pathname === "/" ? "home" : pathname.replace(/^\//, "");
    let cancelled = false;
    fetch(`/api/site/current-page?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setPageId(data?.id ?? null))
      .catch(() => !cancelled && setPageId(null));
    return () => { cancelled = true; };
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const actions = [
    {
      icon: Pencil,
      label: "Edit this page",
      href: pageId ? `/dashboard/pages/${pageId}` : "/dashboard/pages",
    },
    { icon: UserCircle, label: "Profile", href: "/dashboard/profile" },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[9999] flex flex-col items-center gap-1 rounded-2xl bg-gray-900/95 backdrop-blur-sm p-1.5 shadow-xl border border-white/10">
        {actions.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger asChild>
              <a
                href={action.href}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <action.icon className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{action.label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Logout</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
