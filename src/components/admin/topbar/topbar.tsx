"use client";

import { useMemo, useState } from "react";
import { Bell, Search, Sun, Moon, Globe, ChevronDown, Star, ExternalLink } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CMSUser } from "@/types/cms";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const isLocal = ROOT.includes("localhost");
const proto = isLocal ? "http" : "https";

interface Site {
  id: string;
  name: string;
  slug: string;
  is_primary: boolean;
  owner_email?: string;
  custom_domain?: string;
}

interface TopbarProps {
  user?: CMSUser;
  sites?: Site[];
  isSuperAdmin?: boolean;
}

function SiteSwitcher({ sites, isSuperAdmin }: { sites: Site[]; isSuperAdmin: boolean }) {
  const [list] = useState(sites);
  const [query, setQuery] = useState("");

  const active = list.find(s => s.is_primary) ?? list[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      `${s.slug}.${ROOT}`.toLowerCase().includes(q) ||
      s.custom_domain?.toLowerCase().includes(q) ||
      s.owner_email?.toLowerCase().includes(q)
    );
  }, [list, query]);

  function exitImpersonation() {
    // SA's own site is the first in the list (ordered by created_at ASC)
    const ownSite = list[0];
    if (ownSite) {
      window.location.href = `${proto}://${ownSite.slug}.${ROOT}/dashboard`;
    } else {
      window.location.href = `${proto}://${ROOT}/dashboard`;
    }
  }

  function switchSite(site: Site) {
    if (site.is_primary) return;
    window.location.href = `${proto}://${site.slug}.${ROOT}/dashboard`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs max-w-[200px]">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{active?.name ?? "Select site"}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-3 pt-3">
          {isSuperAdmin ? `All Sites (${list.length})` : "Your Sites"}
        </DropdownMenuLabel>
        {list.length > 6 && (
          <div className="px-2 pt-1.5 pb-1">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                placeholder="Search sites..."
                className="w-full h-7 pl-7 pr-2 text-xs rounded-md border bg-background outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-xs text-center text-muted-foreground">No sites match &quot;{query}&quot;</p>
          )}
          {filtered.map(site => (
          <div key={site.id} className="flex items-center gap-1 px-1 py-0.5">
            {/* Click name → switch dashboard to this site */}
            <button
              onClick={() => switchSite(site)}
              className={`flex-1 flex flex-col items-start px-2 py-1.5 rounded-md text-left transition-colors min-w-0 ${
                site.is_primary
                  ? "bg-accent"
                  : "hover:bg-accent"
              }`}
            >
              <span className="text-sm font-medium truncate w-full">{site.name}</span>
              <span className="text-xs text-muted-foreground truncate w-full">
                {site.custom_domain ?? `${site.slug}.${ROOT}`}
              </span>
              {isSuperAdmin && site.owner_email && (
                <span className="text-[11px] text-muted-foreground/70 truncate w-full">{site.owner_email}</span>
              )}
            </button>
            {/* External link — visit site frontend */}
            <a
              href={`${proto}://${site.slug}.${ROOT}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit site"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {/* Star — set as default (SA: marks active in UI only, regular: sets primary) */}
            {!isSuperAdmin && (
              <button
                title={site.is_primary ? "Current site" : "Set as default"}
                onClick={() => switchSite(site)}
                disabled={site.is_primary}
                className={`p-1.5 rounded transition-colors shrink-0 ${
                  site.is_primary ? "text-amber-500 cursor-default" : "text-muted-foreground hover:text-amber-500"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${site.is_primary ? "fill-amber-500" : ""}`} />
              </button>
            )}
          </div>
          ))}
        </div>
        {isSuperAdmin && list.length > 1 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <button
              onClick={exitImpersonation}
              className="w-full px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              ← Back to Main
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminTopbar({ user, sites = [], isSuperAdmin = false }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4 bg-background pl-14 lg:pl-4">
      {/* Site switcher — show when multiple sites, or SA (always sees all) */}
      {sites.length > 0 && <SiteSwitcher sites={sites} isSuperAdmin={isSuperAdmin} />}

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search pages, posts, products..." className="pl-8 h-8 text-sm bg-muted/50" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost" size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="h-8 w-8"
          title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url ?? ""} alt={user?.full_name ?? ""} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
