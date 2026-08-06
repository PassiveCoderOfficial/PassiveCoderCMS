"use client";

import { useMemo, useState } from "react";
import { Bell, Search, Sun, Moon, Globe, ChevronDown, Star, ExternalLink, ArrowDownAZ } from "lucide-react";
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
  status?: string;
  plan?: string;
  created_at?: string;
  is_own?: boolean;
  has_owner?: boolean;
}

const AZ_THRESHOLD = 15;

type FilterChip = "own" | "no_tenant" | "active" | "trial" | "suspended";

const FILTER_CHIPS: { key: FilterChip; label: string }[] = [
  { key: "own", label: "Own" },
  { key: "no_tenant", label: "No Tenant" },
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "suspended", label: "Suspended" },
];

interface TopbarProps {
  user?: CMSUser;
  sites?: Site[];
  isSuperAdmin?: boolean;
}

function SiteSwitcher({ sites, isSuperAdmin }: { sites: Site[]; isSuperAdmin: boolean }) {
  const [list] = useState(sites);
  const [query, setQuery] = useState("");
  const [activeChips, setActiveChips] = useState<Set<FilterChip>>(new Set());
  const [planFilter, setPlanFilter] = useState<string>("");
  const [sortMode, setSortMode] = useState<"latest" | "oldest" | "az">("latest");

  const active = list.find(s => s.is_primary) ?? list[0];

  const plans = useMemo(
    () => [...new Set(list.map(s => s.plan).filter(Boolean))] as string[],
    [list],
  );

  function toggleChip(chip: FilterChip) {
    setActiveChips(prev => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip); else next.add(chip);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = list;

    if (q) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        `${s.slug}.${ROOT}`.toLowerCase().includes(q) ||
        s.custom_domain?.toLowerCase().includes(q) ||
        s.owner_email?.toLowerCase().includes(q)
      );
    }

    if (activeChips.size) {
      result = result.filter(s => {
        return [...activeChips].some(chip => {
          if (chip === "own") return s.is_own;
          if (chip === "no_tenant") return s.has_owner === false;
          if (chip === "active") return s.status === "active";
          if (chip === "trial") return s.status === "trial";
          if (chip === "suspended") return s.status === "suspended";
          return false;
        });
      });
    }

    if (planFilter) {
      result = result.filter(s => s.plan === planFilter);
    }

    // Past AZ_THRESHOLD results with no active filter/search, default to
    // alphabetical so a long unfiltered list is still scannable — recency
    // stops being useful once there's dozens of sites. Still overridable via
    // the sort toggle in either direction, and only applies to the untouched
    // default view (a search or filter narrowing the list keeps whatever
    // sort was explicitly chosen).
    const isDefaultView = !query && !activeChips.size && !planFilter;
    const effectiveSort = sortMode === "latest" && isDefaultView && result.length > AZ_THRESHOLD
      ? "az"
      : sortMode;

    if (effectiveSort === "az") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (effectiveSort === "oldest") {
      result = [...result].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    } else {
      result = [...result].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }

    return result;
  }, [list, query, activeChips, planFilter, sortMode]);

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

        {/* Filter chips + sort — SA/manager only, regular tenants rarely have enough sites to need this */}
        {isSuperAdmin && list.length > 6 && (
          <div className="px-2 pb-1.5 space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {FILTER_CHIPS.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => toggleChip(chip.key)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    activeChips.has(chip.key)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              {plans.length > 1 && (
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium border bg-background text-muted-foreground outline-none"
                >
                  <option value="">All Plans</option>
                  {plans.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Sort:</span>
              {(["latest", "oldest", "az"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    sortMode === mode ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "az" && <ArrowDownAZ className="h-2.5 w-2.5" />}
                  {mode === "latest" ? "Latest" : mode === "oldest" ? "Oldest" : "A–Z"}
                </button>
              ))}
            </div>
          </div>
        )}
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-xs text-center text-muted-foreground">
              {query ? `No sites match "${query}"` : "No sites match the selected filters"}
            </p>
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
