"use client";

import React, { useState } from "react";
import { blockRegistry, type BlockDefinition } from "@/modules/page-builder/block-registry";
import { useBuilderStore } from "@/lib/store/builder";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = blockRegistry.filter((b) => {
    const matchSearch = !search || b.label.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || b.category === activeCategory;
    return matchSearch && matchCat;
  });

  const categories = ["all", ...Object.keys(categoryLabels)];
  const grouped = categories.reduce((acc, cat) => {
    if (cat === "all") return acc;
    acc[cat] = filtered.filter((b) => b.category === cat);
    return acc;
  }, {} as Record<string, BlockDefinition[]>);

  const handleAddBlock = (def: BlockDefinition) => {
    addBlock(def.create());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search blocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto">
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

      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {activeCategory === "all" ? (
          Object.entries(grouped).map(([cat, blocks]) =>
            blocks.length ? (
              <div key={cat}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1">
                  {categoryLabels[cat]}
                </p>
                <BlockGrid blocks={blocks} onAdd={handleAddBlock} />
              </div>
            ) : null,
          )
        ) : (
          <BlockGrid blocks={filtered} onAdd={handleAddBlock} />
        )}
        {!filtered.length && (
          <p className="text-center text-xs text-muted-foreground py-6">No blocks found</p>
        )}
      </div>
    </div>
  );
}

function BlockGrid({ blocks, onAdd }: { blocks: BlockDefinition[]; onAdd: (b: BlockDefinition) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {blocks.map((block) => (
        <button
          key={block.type}
          onClick={() => onAdd(block)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-all text-center group"
        >
          <span className="text-xl leading-none">{block.icon}</span>
          <span className="text-[11px] font-medium leading-tight">{block.label}</span>
        </button>
      ))}
    </div>
  );
}
