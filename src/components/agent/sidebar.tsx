"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Globe, DollarSign, Settings, LogOut, Zap, ExternalLink, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const isLocal = ROOT.includes("localhost");
const proto = isLocal ? "http" : "https";

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

interface Site {
  id: string;
  name: string;
  slug: string;
}

export default function AgentSidebar({ agent, sites }: { agent: Agent; sites: Site[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
        {/* Site switcher */}
        {sites.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No sites yet</p>
        ) : sites.length === 1 ? (
          <div className="flex items-center gap-1 px-1">
            <a
              href={`/api/agent/sites/${sites[0].id}/view`}
              className="flex flex-1 items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors truncate"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{sites[0].name}</span>
            </a>
            <a
              href={`${proto}://${sites[0].slug}.${ROOT}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit site"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-3 h-8 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-left truncate">Switch Site Admin</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Your Sites</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sites.map(site => (
                <div key={site.id} className="flex items-center gap-1 px-1 py-0.5">
                  <a
                    href={`/api/agent/sites/${site.id}/view`}
                    className="flex-1 flex flex-col px-2 py-1.5 rounded-md hover:bg-accent transition-colors min-w-0"
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-sm font-medium truncate">{site.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{site.slug}.{ROOT}</span>
                  </a>
                  <a
                    href={`${proto}://${site.slug}.${ROOT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Visit site"
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
