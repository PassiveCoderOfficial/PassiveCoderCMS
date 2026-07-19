"use client";

import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { presetsByCategory } from "@/modules/page-builder/section-presets";
import { useBuilderStore } from "@/lib/store/builder";

interface InsertSectionButtonProps {
  /** Insert the new section after this block id. Omit to insert at the top. */
  afterId?: string;
}

/**
 * A "+" button that appears between sections on hover and opens a quick
 * section picker, so users can add content exactly where they want it.
 */
export function InsertSectionButton({ afterId }: InsertSectionButtonProps) {
  const { addBlock } = useBuilderStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const q = search.toLowerCase();
  const groups = presetsByCategory
    .map((g) => ({
      ...g,
      presets: g.presets.filter(
        (p) => !q || p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.presets.length > 0);

  return (
    <div
      className="relative h-4 -my-2 z-10 flex items-center justify-center group/insert"
      onClick={(e) => e.stopPropagation()}
    >
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1 rounded-full bg-orange-600 text-white text-[11px] font-medium pl-1.5 pr-2.5 py-1 shadow-md opacity-0 group-hover/insert:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-orange-700"
            aria-label="Add a section here"
          >
            <Plus className="h-3.5 w-3.5" />
            Add section
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="center" sideOffset={8}>
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search sections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-3">
            {groups.map((group) => (
              <div key={group.category}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addBlock(p.create(), afterId);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                    >
                      <span className="text-base leading-none">{p.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium leading-tight">{p.label}</span>
                        <span className="block text-[10px] text-muted-foreground truncate">{p.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!groups.length && (
              <p className="text-center text-xs text-muted-foreground py-4">No sections found</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
