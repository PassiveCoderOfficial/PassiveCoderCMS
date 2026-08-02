"use client";

import { Search, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  PLATFORMS, PLATFORM_LABELS, STATUSES, STATUS_LABELS,
  CONTENT_TYPES, CONTENT_TYPE_LABELS, EMPTY_FILTERS,
  type BrandProfile, type SchedulerFilters, type Platform,
  type ContentStatus, type ContentType,
} from "@/lib/scheduler/types";

/** Up to this many brands render as inline pills; beyond it they collapse into
 *  a dropdown. Small tenants get one-click brand switching, big ones don't get
 *  a horizontally scrolling pill strip. */
const PILL_LIMIT = 5;

export function FilterBar({
  brands, filters, onChange, hasUser,
}: {
  brands: BrandProfile[];
  filters: SchedulerFilters;
  onChange: (f: SchedulerFilters) => void;
  hasUser: boolean;
}) {
  const set = <K extends keyof SchedulerFilters>(key: K, value: SchedulerFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const asPills = brands.length > 0 && brands.length <= PILL_LIMIT;
  const dirty =
    filters.brandIds.length || filters.platforms.length || filters.statuses.length ||
    filters.types.length || filters.mineOnly || filters.q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {asPills ? (
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => set("brandIds", [])}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              filters.brandIds.length === 0
                ? "bg-foreground text-background border-foreground"
                : "hover:bg-muted",
            )}
          >
            All brands
          </button>
          {brands.map((b) => {
            const active = filters.brandIds.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => set("brandIds", toggle(filters.brandIds, b.id))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active ? "border-foreground bg-muted font-medium" : "hover:bg-muted",
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                {b.name}
              </button>
            );
          })}
        </div>
      ) : (
        <MultiSelect
          label="Brands"
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
          selected={filters.brandIds}
          onToggle={(v) => set("brandIds", toggle(filters.brandIds, v))}
        />
      )}

      <MultiSelect
        label="Platform"
        options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
        selected={filters.platforms}
        onToggle={(v) => set("platforms", toggle(filters.platforms, v as Platform))}
      />

      <MultiSelect
        label="Status"
        options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        selected={filters.statuses}
        onToggle={(v) => set("statuses", toggle(filters.statuses, v as ContentStatus))}
      />

      <MultiSelect
        label="Type"
        options={CONTENT_TYPES.map((t) => ({ value: t, label: CONTENT_TYPE_LABELS[t] }))}
        selected={filters.types}
        onToggle={(v) => set("types", toggle(filters.types, v as ContentType))}
      />

      {hasUser && (
        <Button
          variant={filters.mineOnly ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => set("mineOnly", !filters.mineOnly)}
        >
          <User className="h-3.5 w-3.5" /> Mine
        </Button>
      )}

      <div className="relative ml-auto w-full sm:w-56">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Search content…"
          className="h-8 pl-7 text-sm"
        />
      </div>

      {dirty ? (
        <Button variant="ghost" size="sm" className="h-8 gap-1"
          onClick={() => onChange(EMPTY_FILTERS)}>
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      ) : null}
    </div>
  );
}

function MultiSelect({
  label, options, selected, onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-[10px]">{selected.length}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={selected.includes(o.value)}
            onCheckedChange={() => onToggle(o.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
