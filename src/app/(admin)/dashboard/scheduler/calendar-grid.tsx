"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rescheduleItem } from "./actions";
import { dayKeyInTz, timeInTz, wallClockToUtc } from "@/lib/scheduler/tz";
import type { BrandProfile, ContentItem } from "@/lib/scheduler/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({
  items, brands, timezone, onSelect,
}: {
  items: ContentItem[];
  brands: BrandProfile[];
  timezone: string;
  onSelect: (item: ContentItem) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const byDay = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const item of items) {
      const iso = item.scheduled_at ?? item.published_at;
      if (!iso) continue;
      const key = dayKeyInTz(iso, timezone);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
    }
    return map;
  }, [items, timezone]);

  // Monday-first grid covering the whole month plus leading/trailing padding.
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const start = new Date(first.getTime() - lead * 86400000);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getTime() + i * 86400000);
      return {
        date: d,
        key: d.toISOString().slice(0, 10),
        inMonth: d.getUTCMonth() === cursor.month,
      };
    });
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(cursor.year, cursor.month, 1)));

  const shift = (delta: number) => setCursor((c) => {
    const m = c.month + delta;
    return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
  });

  /** Dropping on a day keeps the original time of day and moves only the date
   *  — dragging a 9am post to Friday should stay 9am, not reset to midnight. */
  const onDrop = (targetKey: string) => {
    if (!dragId) return;
    const item = items.find((i) => i.id === dragId);
    setDragId(null);
    if (!item?.scheduled_at) return;
    if (dayKeyInTz(item.scheduled_at, timezone) === targetKey) return;

    const next = wallClockToUtc(
      `${targetKey}T${timeInTz(item.scheduled_at, timezone)}`, timezone,
    );
    if (!next) return;

    startTransition(async () => {
      await rescheduleItem(item.id, next);
    });
  };

  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs"
            onClick={() => {
              const n = new Date();
              setCursor({ year: n.getUTCFullYear(), month: n.getUTCMonth() });
            }}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-px border-b pb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-1 text-center text-[11px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-border">
            {cells.map((cell) => {
              const dayItems = byDay.get(cell.key) ?? [];
              const isToday = cell.key === todayKey;
              return (
                <div
                  key={cell.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(cell.key)}
                  className={cn(
                    "min-h-[92px] bg-background p-1 transition-colors",
                    !cell.inMonth && "bg-muted/40",
                    dragId && "hover:bg-primary/5",
                  )}
                >
                  <div className={cn(
                    "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    isToday ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground",
                  )}>
                    {cell.date.getUTCDate()}
                  </div>

                  <div className="space-y-0.5">
                    {dayItems.slice(0, 4).map((item) => {
                      const brand = brandById.get(item.brand_id);
                      return (
                        <button
                          key={item.id}
                          draggable
                          onDragStart={() => setDragId(item.id)}
                          onDragEnd={() => setDragId(null)}
                          onClick={() => onSelect(item)}
                          className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] hover:bg-muted"
                          title={item.title}
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: brand?.color ?? "#94a3b8" }} />
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {item.scheduled_at ? timeInTz(item.scheduled_at, timezone) : ""}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </button>
                      );
                    })}
                    {dayItems.length > 4 && (
                      <p className="px-1 text-[10px] text-muted-foreground">
                        +{dayItems.length - 4} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
