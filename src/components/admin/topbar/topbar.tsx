"use client";

import { useState } from "react";
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

interface Site { id: string; name: string; slug: string; is_primary: boolean; }

interface TopbarProps {
  user?: CMSUser;
  sites?: Site[];
}

function SiteSwitcher({ sites }: { sites: Site[] }) {
  const [list, setList] = useState(sites);
  const [loading, setLoading] = useState<string | null>(null);

  const primary = list.find(s => s.is_primary) ?? list[0];

  async function setDefault(siteId: string) {
    setLoading(siteId);
    const res = await fetch("/api/user/primary-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId }),
    });
    setLoading(null);
    if (res.ok) {
      setList(prev => prev.map(s => ({ ...s, is_primary: s.id === siteId })));
      toast.success("Default site updated");
    } else {
      toast.error("Failed to update default site");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs max-w-[200px]">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{primary?.name ?? "Select site"}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Your Sites</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.map(site => (
          <div key={site.id} className="flex items-center gap-1 px-1">
            <DropdownMenuItem
              className="flex-1 cursor-pointer gap-2"
              onClick={() => window.open(`${proto}://${site.slug}.${ROOT}`, "_blank")}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{site.name}</p>
                <p className="text-xs text-muted-foreground truncate">{site.slug}.{ROOT}</p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </DropdownMenuItem>
            <button
              title={site.is_primary ? "Default site" : "Set as default"}
              onClick={() => !site.is_primary && setDefault(site.id)}
              disabled={loading === site.id || site.is_primary}
              className={`p-1.5 rounded transition-colors shrink-0 ${
                site.is_primary ? "text-amber-500 cursor-default" : "text-muted-foreground hover:text-amber-500"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${site.is_primary ? "fill-amber-500" : ""}`} />
            </button>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminTopbar({ user, sites = [] }: TopbarProps) {
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
      {/* Site switcher — only if 2+ sites */}
      {sites.length > 1 && <SiteSwitcher sites={sites} />}

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
