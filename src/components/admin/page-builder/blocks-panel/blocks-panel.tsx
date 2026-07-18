"use client";

import React, { useEffect, useState } from "react";
import { blockRegistry, type BlockDefinition } from "@/modules/page-builder/block-registry";
import { presetsByCategory, presetCategoryLabels, type SectionPreset, type PresetCategory } from "@/modules/page-builder/section-presets";
import { useBuilderStore } from "@/lib/store/builder";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayersPanel } from "./layers-panel";
import { deepClone, generateId } from "@/lib/utils";
import type { Block, ContainerBlockProps } from "@/types/cms";

interface SavedPreset {
  id: string;
  name: string;
  category: string;
  blocks: Block;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  content: "Content",
  media: "Media",
  ecommerce: "Ecommerce",
  interactive: "Interactive",
};

export function BlocksPanel() {
  const { addBlock } = useBuilderStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"sections" | "blocks" | "layers">("sections");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sectionSource, setSectionSource] = useState<"global" | "mine">("global");
  const [savedPresets, setSavedPresets] = useState<SavedPreset[] | null>(null);
  const loadingSaved = tab === "sections" && sectionSource === "mine" && savedPresets === null;

  useEffect(() => {
    if (tab !== "sections" || sectionSource !== "mine" || savedPresets !== null) return;
    fetch("/api/page-builder/section-presets")
      .then((r) => r.json())
      .then((data) => setSavedPresets(Array.isArray(data) ? data : []))
      .catch(() => setSavedPresets([]));
  }, [tab, sectionSource, savedPresets]);

  async function deleteSavedPreset(id: string) {
    setSavedPresets((prev) => (prev ?? []).filter((p) => p.id !== id));
    await fetch(`/api/page-builder/section-presets?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  // Saved presets are reused across pages/insertions — regenerate every block
  // id (and nested column-block ids) on each add so duplicates never collide
  // in the store or share React keys.
  function freshIds(block: Block): Block {
    const clone = deepClone(block);
    clone.id = generateId();
    if (clone.type === "container") {
      for (const col of (clone as ContainerBlockProps).data.columns) {
        col.blocks = col.blocks.map(freshIds);
      }
    }
    return clone;
  }

  const q = search.toLowerCase();

  const filteredBlocks = blockRegistry.filter((b) => {
    const matchSearch = !q || b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
    const matchCat = activeCategory === "all" || b.category === activeCategory;
    return matchSearch && matchCat;
  });

  const filteredPresetGroups = presetsByCategory
    .map((g) => ({
      ...g,
      presets: g.presets.filter(
        (p) => !q || p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.presets.length > 0);

  const filteredSavedPresets = (savedPresets ?? []).filter(
    (p) => !q || p.name.toLowerCase().includes(q),
  );
  const savedByCategory = (Object.keys(presetCategoryLabels) as PresetCategory[])
    .map((cat) => ({
      category: cat,
      label: presetCategoryLabels[cat],
      presets: filteredSavedPresets.filter((p) => p.category === cat),
    }))
    .filter((g) => g.presets.length > 0);

  const categories = ["all", ...Object.keys(categoryLabels)];
  const grouped = categories.reduce((acc, cat) => {
    if (cat === "all") return acc;
    acc[cat] = filteredBlocks.filter((b) => b.category === cat);
    return acc;
  }, {} as Record<string, BlockDefinition[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b shrink-0">
        {([
          { value: "sections", label: "Sections" },
          { value: "blocks", label: "Blocks" },
          { value: "layers", label: "Layers" },
        ] as const).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold transition-colors border-b-2",
              tab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab !== "layers" && (
        <div className="p-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={tab === "sections" ? "Search sections..." : "Search blocks..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      )}

      {tab === "layers" ? (
        <LayersPanel />
      ) : tab === "sections" ? (
        <>
          <div className="flex gap-1 px-2 pt-2 shrink-0">
            {([
              { value: "global", label: "Global" },
              { value: "mine", label: "User Made" },
            ] as const).map((s) => (
              <button
                key={s.value}
                onClick={() => setSectionSource(s.value)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  sectionSource === s.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {sectionSource === "global" ? (
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <p className="text-[11px] text-muted-foreground px-1 leading-snug">
                Ready-made sections with text already written — click to add, then change the words to match your business.
              </p>
              {filteredPresetGroups.map((group) => (
                <div key={group.category}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.presets.map((p) => (
                      <PresetRow key={p.id} preset={p} onAdd={() => addBlock(p.create())} />
                    ))}
                  </div>
                </div>
              ))}
              {!filteredPresetGroups.length && (
                <p className="text-center text-xs text-muted-foreground py-6">No sections found</p>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <p className="text-[11px] text-muted-foreground px-1 leading-snug">
                Sections saved from this site&apos;s page builder — select a container, then &quot;Save as section&quot; in its toolbar.
              </p>
              {loadingSaved && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!loadingSaved && savedByCategory.map((group) => (
                <div key={group.category}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.presets.map((p) => (
                      <SavedPresetRow key={p.id} preset={p} onAdd={() => addBlock(freshIds(p.blocks))} onDelete={() => deleteSavedPreset(p.id)} />
                    ))}
                  </div>
                </div>
              ))}
              {!loadingSaved && !savedByCategory.length && (
                <p className="text-center text-xs text-muted-foreground py-6">No saved sections yet</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Category filter */}
          <div className="flex gap-1 p-2 border-b overflow-x-auto shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {cat === "all" ? "All" : categoryLabels[cat]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {activeCategory === "all" ? (
              Object.entries(grouped).map(([cat, blocks]) =>
                blocks.length ? (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1">
                      {categoryLabels[cat]}
                    </p>
                    <BlockGrid blocks={blocks} onAdd={(def) => addBlock(def.create())} />
                  </div>
                ) : null,
              )
            ) : (
              <BlockGrid blocks={filteredBlocks} onAdd={(def) => addBlock(def.create())} />
            )}
            {!filteredBlocks.length && (
              <p className="text-center text-xs text-muted-foreground py-6">No blocks found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PresetRow({ preset, onAdd }: { preset: SectionPreset; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group"
    >
      <span className="text-lg leading-none mt-0.5">{preset.icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold leading-tight">{preset.label}</span>
        <span className="block text-[10px] text-muted-foreground leading-snug mt-0.5">
          {preset.description}
        </span>
      </span>
      <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
    </button>
  );
}

function SavedPresetRow({ preset, onAdd, onDelete }: { preset: SavedPreset; onAdd: () => void; onDelete: () => void }) {
  return (
    <div className="w-full flex items-center gap-2 p-2.5 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group">
      <button onClick={onAdd} className="flex-1 min-w-0 text-left">
        <span className="block text-xs font-semibold leading-tight truncate">{preset.name}</span>
        <span className="block text-[10px] text-muted-foreground leading-snug mt-0.5">
          Saved {new Date(preset.created_at).toLocaleDateString()}
        </span>
      </button>
      <button onClick={onAdd} className="shrink-0 p-1 text-muted-foreground hover:text-primary">
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDelete} className="shrink-0 p-1 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function BlockGrid({ blocks, onAdd }: { blocks: BlockDefinition[]; onAdd: (b: BlockDefinition) => void }) {
  return (
    <TooltipProvider delayDuration={400}>
      <div className="grid grid-cols-2 gap-1.5">
        {blocks.map((block) => (
          <Tooltip key={block.type}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAdd(block)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-all text-center group"
              >
                <span className="text-xl leading-none">{block.icon}</span>
                <span className="text-[11px] font-medium leading-tight">{block.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs max-w-[200px]">{block.description}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
