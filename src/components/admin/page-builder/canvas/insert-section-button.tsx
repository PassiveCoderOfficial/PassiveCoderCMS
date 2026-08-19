"use client";

import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { presetsByCategory } from "@/modules/page-builder/section-presets";
import { blockRegistry } from "@/modules/page-builder/block-registry";
import { COLUMN_LAYOUTS, createColumnLayout } from "@/modules/page-builder/column-layouts";
import { PresetThumbnail } from "../blocks-panel/preset-thumbnail";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { cn } from "@/lib/utils";
import type { Block, BlockType } from "@/types/cms";

interface InsertSectionButtonProps {
  /** Insert the new section after this block id. Omit to insert at the top. */
  afterId?: string;
  /** Insert into a container column rather than at page root. */
  path?: ContainerPath;
  /** Restricts what can be inserted — used by the header/footer builder. */
  allowedBlockTypes?: readonly BlockType[];
  /** Compact trigger for use inside a container column. */
  compact?: boolean;
}

type Tab = "sections" | "blocks" | "layout";

/**
 * The "+" between sections: a visual picker for what goes here.
 *
 * Three tabs, matching how people actually decide — a ready-made section, a
 * single block, or a column split to arrange things in. Sections are shown as
 * layout thumbnails rather than a text list, because a name like "Welcome —
 * Big Photo" means very little until you can see the shape of it.
 */
export function InsertSectionButton({ afterId, path, allowedBlockTypes, compact }: InsertSectionButtonProps) {
  const { addBlock } = useBuilderStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("sections");
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();

  const insert = (block: Block) => {
    addBlock(block, afterId, path);
    setOpen(false);
    setSearch("");
  };

  const sectionGroups = useMemo(
    () =>
      presetsByCategory
        .map((g) => ({
          ...g,
          presets: g.presets.filter((p) => {
            const allowed = !allowedBlockTypes || allowedBlockTypes.includes(p.blockType);
            const matches = !q || p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
            return allowed && matches;
          }),
        }))
        .filter((g) => g.presets.length > 0),
    [q, allowedBlockTypes],
  );

  const blocks = useMemo(
    () =>
      blockRegistry.filter((b) => {
        // Containers hold blocks, and the store only supports one level of
        // nesting — offering one inside a column would produce a layout the
        // renderer deliberately skips.
        if (b.type === "container" && path) return false;
        const allowed = !allowedBlockTypes || allowedBlockTypes.includes(b.type);
        const matches = !q || b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
        return allowed && matches;
      }),
    [q, allowedBlockTypes, path],
  );

  const layouts = useMemo(
    () => COLUMN_LAYOUTS.filter((l) => !q || l.label.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)),
    [q],
  );

  // A container cannot hold another container, so the layout tab is only
  // offered at page root.
  const showLayout = !path && (!allowedBlockTypes || allowedBlockTypes.includes("container"));

  const TABS: { value: Tab; label: string; count: number }[] = [
    { value: "sections", label: "Sections", count: sectionGroups.reduce((n, g) => n + g.presets.length, 0) },
    { value: "blocks", label: "Blocks", count: blocks.length },
    ...(showLayout ? [{ value: "layout" as Tab, label: "Columns", count: layouts.length }] : []),
  ];

  return (
    <div
      className={cn("relative z-10 flex items-center justify-center group/insert", compact ? "h-6" : "h-4 -my-2")}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(""); setTab("sections"); } }}
      >
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 rounded-full bg-orange-600 text-white font-medium shadow-md transition-opacity hover:bg-orange-700",
              "opacity-0 group-hover/insert:opacity-100 focus:opacity-100 data-[state=open]:opacity-100",
              compact ? "text-[10px] px-2 py-0.5" : "text-[11px] pl-1.5 pr-2.5 py-1",
            )}
            aria-label="Add a section here"
          >
            <Plus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {compact ? "Add" : "Add section"}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[420px] p-0" align="center" sideOffset={8}>
          <div className="border-b">
            <div className="flex">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2",
                    tab === t.value
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                  <span className="ml-1 text-[10px] text-muted-foreground">{t.count}</span>
                </button>
              ))}
            </div>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder={tab === "layout" ? "Search column layouts…" : tab === "blocks" ? "Search blocks…" : "Search sections…"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2">
            {tab === "sections" && (
              sectionGroups.length ? (
                <div className="space-y-3">
                  {sectionGroups.map((group) => (
                    <div key={group.category}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1.5">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.presets.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => insert(p.create())}
                            title={p.description}
                            className="rounded-lg border p-1 text-left transition-all hover:border-primary hover:bg-primary/5"
                          >
                            <PresetThumbnail kind={p.thumb} />
                            <span className="flex items-center gap-1 px-0.5 pt-1">
                              <span className="text-[11px] leading-none shrink-0">{p.icon}</span>
                              <span className="flex-1 truncate text-[10px] font-medium leading-tight">{p.label}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Empty label="sections" />
            )}

            {tab === "blocks" && (
              blocks.length ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {blocks.map((b) => (
                    <button
                      key={b.type}
                      onClick={() => insert(b.create())}
                      title={b.description}
                      className="flex items-center gap-2 rounded-lg border p-2 text-left transition-all hover:border-primary hover:bg-primary/5"
                    >
                      <span className="text-base leading-none shrink-0">{b.icon}</span>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{b.label}</span>
                    </button>
                  ))}
                </div>
              ) : <Empty label="blocks" />
            )}

            {tab === "layout" && (
              layouts.length ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {layouts.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => insert(createColumnLayout(l))}
                      title={l.description}
                      className="rounded-lg border p-1.5 text-left transition-all hover:border-primary hover:bg-primary/5"
                    >
                      {/* The split itself is the preview — the proportions
                          here are the real widthPct values. */}
                      <span className="flex gap-0.5 h-8 rounded bg-muted/60 p-1">
                        {l.widths.map((w, i) => (
                          <span key={i} className="rounded-sm bg-muted-foreground/25" style={{ flexBasis: `${w}%` }} />
                        ))}
                      </span>
                      <span className="block truncate px-0.5 pt-1 text-[10px] font-medium leading-tight">{l.label}</span>
                    </button>
                  ))}
                </div>
              ) : <Empty label="layouts" />
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-xs text-muted-foreground">No {label} found</p>;
}
