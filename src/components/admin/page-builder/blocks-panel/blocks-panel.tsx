"use client";

import React, { useState } from "react";
import { blockRegistry, type BlockDefinition } from "@/modules/page-builder/block-registry";
import { presetsByCategory, type SectionPreset } from "@/modules/page-builder/section-presets";
import { useBuilderStore } from "@/lib/store/builder";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayersPanel } from "./layers-panel";

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
