"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ACCESS_LEVELS, ACCESS_LEVEL_LABELS, type AccessLevel } from "@/lib/scheduler/types";
import { searchTenantUsers, grantAccess, revokeAccess } from "../actions";
import { useT } from "@/lib/i18n/language-provider";

type Row = {
  user_id: string;
  full_name: string | null;
  email: string;
  access_level?: string;
  implicit?: string;
};

type SearchResult = {
  user_id: string; full_name: string | null; email: string;
  role: string; has_access: boolean;
};

export default function AccessClient({ rows }: { rows: Row[] }) {
  const t = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [level, setLevel] = useState<AccessLevel>("editor");
  const seq = useRef(0);

  // Debounced search — typing shouldn't fire a query per keystroke, and a slow
  // response for an earlier prefix must not overwrite a newer one, hence the
  // sequence guard.
  useEffect(() => {
    if (!q.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      const res = await searchTenantUsers(q.trim());
      if (mine !== seq.current) return;
      setResults(res.results ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const grant = (userId: string) =>
    startTransition(async () => {
      await grantAccess(userId, level);
      setQ(""); setResults([]);
      router.refresh();
    });

  const revoke = (userId: string) =>
    startTransition(async () => {
      await revokeAccess(userId);
      router.refresh();
    });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{t("scheduler.accessTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("scheduler.accessSubtitle")}
        </p>
      </div>

      <div className="rounded-lg border p-3 space-y-3 bg-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("scheduler.searchMembersPlaceholder")}
              className="h-9 pl-7"
            />
            {searching && (
              <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <Select value={level} onValueChange={(v) => setLevel(v as AccessLevel)}>
            <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACCESS_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>{ACCESS_LEVEL_LABELS[l]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {q.trim() && !searching && results.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t("scheduler.noMatchingMembers")}
          </p>
        )}

        {results.length > 0 && (
          <div className="divide-y rounded-md border">
            {results.map((r) => (
              <div key={r.user_id} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.full_name || r.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.email} · {r.role}
                  </p>
                </div>
                {r.has_access ? (
                  <Badge variant="secondary" className="text-[10px]">{t("scheduler.hasAccess")}</Badge>
                ) : (
                  <Button size="sm" className="h-7 text-xs" onClick={() => grant(r.user_id)}>
                    {t("scheduler.giveAccess")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">{t("scheduler.peopleWithAccess")}</h2>
        <div className="divide-y rounded-lg border bg-card">
          {rows.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("scheduler.nobodyYet")}
            </p>
          )}
          {rows.map((r) => (
            <div key={r.user_id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{r.full_name || r.email}</p>
                <p className="truncate text-xs text-muted-foreground">{r.email}</p>
              </div>

              {r.implicit ? (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <ShieldCheck className="h-3 w-3" />
                  {t("scheduler.siteRole", { role: r.implicit })}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  {r.access_level}
                </Badge>
              )}

              {/* Owners and admins have access by virtue of running the site —
                  there's no grant row to remove, so no revoke control. */}
              {!r.implicit && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                  title={t("scheduler.removeAccess")} onClick={() => revoke(r.user_id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
