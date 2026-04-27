"use client";

import Link from "next/link";
import { ShieldCheck, ArrowLeft, LogIn, X } from "lucide-react";

interface SABannerProps {
  tenantName: string;
  tenantId: string;
}

export function SABanner({ tenantName, tenantId }: SABannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-indigo-600 text-white text-sm shrink-0 z-50">
      <ShieldCheck className="w-4 h-4 shrink-0" />
      <span className="font-semibold">Super Admin</span>
      <span className="text-indigo-200">—</span>
      <span className="text-indigo-100">Browsing as <strong>{tenantName}</strong></span>

      <div className="flex items-center gap-2 ml-auto">
        <a
          href={`/api/super-admin/impersonate/login-as?tenant_id=${tenantId}`}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1 rounded-md transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          Login as Site Admin
        </a>
        <a
          href="/api/super-admin/impersonate/exit"
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Super Admin
        </a>
        <a
          href="/api/auth/signout"
          className="flex items-center gap-1.5 bg-white/10 hover:bg-red-500/60 text-white text-xs font-medium px-3 py-1 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Sign Out
        </a>
      </div>
    </div>
  );
}
