"use client";

import { Zap, ArrowLeft } from "lucide-react";

interface AgentBannerProps {
  tenantName: string;
}

export function AgentBanner({ tenantName }: AgentBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-amber-600 text-white text-sm shrink-0 z-50">
      <Zap className="w-4 h-4 shrink-0" />
      <span className="font-semibold">Staff View</span>
      <span className="text-amber-200">—</span>
      <span className="text-amber-100">Viewing <strong>{tenantName}</strong>&apos;s dashboard</span>

      <div className="flex items-center gap-2 ml-auto">
        <a
          href="/api/agent/sites/exit-view"
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Sites
        </a>
      </div>
    </div>
  );
}
