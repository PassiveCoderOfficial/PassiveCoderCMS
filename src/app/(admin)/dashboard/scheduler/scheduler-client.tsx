"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, CalendarDays, AlertTriangle, Inbox, CheckCircle2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BUCKET_LABELS, EMPTY_FILTERS, PLATFORM_SHORT, PLATFORM_COLORS,
  STATUS_CLASSES, STATUS_LABELS, CONTENT_TYPE_LABELS,
  type Bucket, type BrandChannel, type BrandProfile, type ContentItem,
  type SchedulerFilters, type Platform, type ContentStatus,
} from "@/lib/scheduler/types";
import { dayKeyInTz, timeInTz } from "@/lib/scheduler/tz";
import { ItemSheet } from "./item-sheet";
import { CalendarGrid } from "./calendar-grid";
import { FilterBar } from "./filter-bar";

const BUCKET_ICONS = {
  upcoming: ListChecks,
  attention: AlertTriangle,
  backlog: Inbox,
  published: CheckCircle2,
  calendar: CalendarDays,
} as const;

/** Day headings read as "Today / Tomorrow / weekday" rather than raw dates —
 *  the daily queue is scanned, not read. */
function dayLabel(iso: string, tz: string) {
  const d = new Date(iso);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: tz }).format(d);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  const target = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: tz })
    .format(new Date(Date.now() + 86400000));

  const date = fmt({ weekday: "short", day: "numeric", month: "short" });
  if (target === today) return `Today · ${date}`;
  if (target === tomorrow) return `Tomorrow · ${date}`;
  return date;
}

function timeLabel(iso: string | null, tz: string) {
  return iso ? timeInTz(iso, tz) : "—";
}

export default function SchedulerClient({
  bucket, initialItems, counts, brands, channels, currentUserId,
}: {
  bucket: Bucket;
  initialItems: ContentItem[];
  counts: Record<Bucket, number>;
  brands: BrandProfile[];
  channels: BrandChannel[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState<SchedulerFilters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);

  const tz = brands[0]?.timezone ?? "Asia/Dhaka";

  const brandById = useMemo(
    () => new Map(brands.map((b) => [b.id, b])),
    [brands],
  );

  // Filtering happens client-side: the feed is already bounded per bucket, and
  // keeping it local makes brand/platform toggles instant instead of a round
  // trip per click.
  const filtered = useMemo(() => {
    return initialItems.filter((item) => {
      if (filters.brandIds.length && !filters.brandIds.includes(item.brand_id)) return false;
      if (filters.statuses.length && !filters.statuses.includes(item.status)) return false;
      if (filters.types.length && !filters.types.includes(item.content_type)) return false;
      if (filters.mineOnly && item.assignee_id !== currentUserId) return false;
      if (filters.platforms.length) {
        const platforms = (item.content_targets ?? []).map((t) => t.platform);
        if (!platforms.some((p) => filters.platforms.includes(p))) return false;
      }
      if (filters.q) {
        const hay = `${item.title} ${item.hook ?? ""} ${item.body ?? ""}`.toLowerCase();
        if (!hay.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  }, [initialItems, filters, currentUserId]);

  // Group by day for the queue views. Backlog has no dates, so it renders flat.
  const grouped = useMemo(() => {
    if (bucket === "backlog") return [["", filtered] as const];
    const map = new Map<string, ContentItem[]>();
    for (const item of filtered) {
      const key = item.scheduled_at ?? item.published_at ?? "";
      const day = key ? dayKeyInTz(key, tz) : "undated";
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    }
    return [...map.entries()].map(([k, v]) => [k, v] as const);
  }, [filtered, bucket, tz]);

  const switchTab = (next: Bucket) => {
    startTransition(() => router.push(`/dashboard/scheduler?tab=${next}`));
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Content Scheduler</h1>
          <p className="text-sm text-muted-foreground">
            Plan, schedule and track social content across every brand.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setCreating(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> New content
        </Button>
      </div>

      <FilterBar
        brands={brands}
        filters={filters}
        onChange={setFilters}
        hasUser={!!currentUserId}
      />

      {/* Tabs are modes (time/workflow), never data filters — brand lives in
          the filter bar so a tenant with a dozen brands doesn't get a dozen
          tabs. */}
      <div className="flex items-center gap-1 overflow-x-auto border-b">
        {(Object.keys(BUCKET_LABELS) as Bucket[]).map((b) => {
          const Icon = BUCKET_ICONS[b];
          const active = b === bucket;
          return (
            <button
              key={b}
              onClick={() => switchTab(b)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {BUCKET_LABELS[b]}
              {counts[b] > 0 && (
                <span className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  b === "attention" && counts[b] > 0
                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    : "bg-muted text-muted-foreground",
                )}>
                  {counts[b]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {bucket === "calendar" ? (
        <CalendarGrid
          items={filtered}
          brands={brands}
          timezone={tz}
          onSelect={(item) => { setCreating(false); setEditing(item); }}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {bucket === "attention"
              ? "Nothing overdue or failed. All clear."
              : bucket === "backlog"
                ? "No ideas parked yet — add one and schedule it later."
                : "Nothing here yet."}
          </p>
          {brands.length === 0 && (
            <Button variant="outline" size="sm" className="mt-3"
              onClick={() => router.push("/dashboard/scheduler/brands")}>
              Set up your first brand
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([day, dayItems]) => (
            <div key={day || "all"}>
              {day && day !== "undated" && (
                <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {dayLabel(dayItems[0].scheduled_at ?? dayItems[0].published_at ?? "", tz)}
                </h2>
              )}
              <div className="rounded-lg border divide-y">
                {dayItems.map((item) => {
                  const brand = brandById.get(item.brand_id);
                  const targets = item.content_targets ?? [];
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setCreating(false); setEditing(item); }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {timeLabel(item.scheduled_at ?? item.published_at, tz)}
                      </span>

                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: brand?.color ?? "#94a3b8" }}
                        title={brand?.name}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {brand?.name} · {CONTENT_TYPE_LABELS[item.content_type]}
                          {item.hook ? ` · ${item.hook}` : ""}
                        </span>
                      </span>

                      <span className="hidden shrink-0 items-center gap-1 sm:flex">
                        {targets.slice(0, 5).map((t) => (
                          <span
                            key={t.id}
                            className="rounded px-1 py-0.5 text-[10px] font-semibold text-white"
                            style={{ background: PLATFORM_COLORS[t.platform as Platform] }}
                            title={t.platform}
                          >
                            {PLATFORM_SHORT[t.platform as Platform]}
                          </span>
                        ))}
                      </span>

                      <Badge variant="secondary"
                        className={cn("shrink-0 text-[10px]", STATUS_CLASSES[item.status])}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <ItemSheet
          item={editing}
          brands={brands}
          channels={channels}
          open
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            startTransition(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}
