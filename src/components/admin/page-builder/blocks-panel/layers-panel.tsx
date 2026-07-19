"use client";

import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useBuilderStore } from "@/lib/store/builder";
import { cn } from "@/lib/utils";
import type { Block, ContainerBlockProps } from "@/types/cms";

export function LayersPanel() {
  const { blocks, selectedBlockId, selectBlock, hoverBlock, setMobileSheet } = useBuilderStore();

  // On mobile, picking a layer closes the sheet so the canvas selection is
  // visible. No-op on desktop (mobileSheet stays null).
  const handleSelect = (id: string | undefined) => {
    selectBlock(id);
    setMobileSheet(null);
  };

  if (!blocks.length) {
    return <p className="text-center text-xs text-muted-foreground py-6 px-3">No blocks on this page yet</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
      {blocks.map((block) => (
        <LayerRow
          key={block.id}
          block={block}
          depth={0}
          selectedBlockId={selectedBlockId}
          onSelect={handleSelect}
          onHover={hoverBlock}
        />
      ))}
    </div>
  );
}

function LayerRow({
  block, depth, selectedBlockId, onSelect, onHover,
}: {
  block: Block;
  depth: number;
  selectedBlockId?: string;
  onSelect: (id: string | undefined) => void;
  onHover: (id: string | undefined) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const isContainer = block.type === "container";
  const columns = isContainer ? (block as ContainerBlockProps).data.columns : [];
  const isSelected = selectedBlockId === block.id;

  return (
    <div>
      <button
        onClick={() => onSelect(block.id)}
        onMouseEnter={() => onHover(block.id)}
        onMouseLeave={() => onHover(undefined)}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={cn(
          "w-full flex items-center gap-1 py-1.5 pr-2 rounded text-xs text-left transition-colors",
          isSelected ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-foreground",
        )}
      >
        {isContainer ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="shrink-0 -ml-1 p-0.5"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="truncate capitalize">{block.type.replace(/_/g, " ")}</span>
        {block.visible === false && <span className="ml-auto text-[10px] opacity-60 shrink-0">hidden</span>}
      </button>

      {isContainer && expanded && columns.map((col, i) => (
        <div key={col.id}>
          <div
            style={{ paddingLeft: 8 + (depth + 1) * 14 }}
            className="text-[10px] uppercase tracking-wide text-muted-foreground py-1"
          >
            Column {i + 1}
          </div>
          {col.blocks.map((child) => (
            <LayerRow
              key={child.id}
              block={child}
              depth={depth + 2}
              selectedBlockId={selectedBlockId}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
          {!col.blocks.length && (
            <p style={{ paddingLeft: 8 + (depth + 2) * 14 }} className="text-[10px] text-muted-foreground py-1">
              Empty
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
