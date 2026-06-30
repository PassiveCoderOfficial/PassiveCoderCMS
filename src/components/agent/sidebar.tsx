"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Globe, DollarSign, Settings, LogOut, Zap, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { label: "Overview", href: "/agent", icon: LayoutDashboard, exact: true },
  { label: "My Sites", href: "/agent/sites", icon: Globe },
  { label: "Commissions", href: "/agent/commissions", icon: DollarSign },
  { label: "Profile", href: "/agent/profile", icon: Settings },
];

interface Agent {
  full_name: string;
  referral_code: string;
  commission_rate: number;
}

export default function AgentSidebar({ agent }: { agent: Agent }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-56 flex flex-col border-r bg-card flex-shrink-0">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b">
        <Zap className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">Staff Portal</span>
      </div>

      <div className="px-3 py-3 border-b">
        <p className="text-xs font-semibold truncate">{agent.full_name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Code: <span className="font-mono font-medium text-primary">{agent.referral_code}</span>
        </p>
        <p className="text-[10px] text-muted-foreground">{agent.commission_rate}% rate</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Switch to Site Admin
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-red-500 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
