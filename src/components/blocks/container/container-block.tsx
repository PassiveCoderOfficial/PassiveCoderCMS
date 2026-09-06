import React from "react";
import type { ContainerBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ContainerHeaderBehavior } from "./container-header-behavior";

const GAP_CLASS = { none: "gap-0", sm: "gap-3", md: "gap-6", lg: "gap-10" } as const;
const ALIGN_CLASS = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" } as const;
const JUSTIFY_CLASS = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" } as const;

/**
 * The published counterpart to the builder's container: a row (or column) of
 * columns, each holding its own blocks.
 *
 * Nested blocks are rendered by the caller and passed in as `columnContent`,
 * because rendering a block is async on the server (several block types await
 * their own data) and this component stays a plain layout shell.
 *
 * Mirrors the builder's flex/gap/align classes so what's arranged in the
 * editor is what ships — minus the drop zones and dashed outlines.
 */
export function ContainerBlock({
  block,
  columnContent,
}: {
  block: ContainerBlockProps;
  /** Rendered blocks per column, index-aligned with `block.data.columns`. */
  columnContent: React.ReactNode[];
}) {
  const { columns, direction, gap, align, justify, wrapOnMobile, sticky, scrollAware, transparent, glass } = block.data;
  if (!columns?.length) return null;

  const isRow = direction === "row";
  const isHeader = sticky || scrollAware || transparent;

  const inner = (
    <div
      className={cn(
        "max-w-7xl mx-auto flex w-full",
        // A row stacks on small screens unless the author turned that off —
        // side-by-side columns on a phone are unreadable at these widths.
        // Header containers are the deliberate exception: a site header
        // stacking into a tall column on mobile is what the legacy single
        // navigation block never did (it always stayed one row, with its
        // own hamburger/drawer for what didn't fit) — found live on a real
        // tenant after the navigation->sub-block migration (2026-09-06):
        // logo/nav/CTA stacked vertically, the CTA landing mid-page over
        // the hero with no responsive handling of its own. wrapOnMobile is
        // simply not the right knob for a header row regardless of its
        // stored value.
        isRow ? (isHeader || wrapOnMobile === false ? "flex-row" : "flex-col md:flex-row") : "flex-col",
        GAP_CLASS[gap] ?? GAP_CLASS.md,
        ALIGN_CLASS[align] ?? ALIGN_CLASS.stretch,
        JUSTIFY_CLASS[justify] ?? JUSTIFY_CLASS.start,
        // Header containers get their own horizontal padding + fixed height,
        // matching the legacy nav bar, since this max-w div sits inside
        // ContainerHeaderBehavior's full-width bar rather than in normal
        // page flow.
        isHeader && "px-4 sm:px-6 h-[4.5rem]",
      )}
    >
      {columns.map((col, i) => (
        <div
          key={col.id}
          className={cn(
            "min-w-0 flex flex-col gap-2",
            // The middle column (nav links) grows to fill whatever space the
            // logo/CTA don't need, same as the legacy nav's own <ul> did
            // with its ml-4 flex-1 — without this the mobile hamburger sits
            // right after the logo instead of pinned to the far right.
            isHeader && (i === 1 && columns.length > 1 ? "flex-row items-center flex-1" : "flex-row items-center shrink-0"),
          )}
          // flexBasis carries the author's width split on ordinary content
          // rows. A header's columns hold single small sub-blocks (a logo,
          // a button) sized to their own content instead — a percentage
          // split tuned for a wide desktop bar (e.g. 25/50/25) would squeeze
          // the logo into an unreadably narrow sliver on a phone, even once
          // kept in one row above. auto-sizing plus the shrink allowance is
          // what the legacy nav bar's own logo/CTA always did.
          style={isRow && !isHeader ? { flexBasis: `${col.widthPct}%`, flexGrow: 0, flexShrink: 1 } : undefined}
        >
          {columnContent[i] ?? null}
        </div>
      ))}
    </div>
  );

  if (!isHeader) return inner;

  return (
    <ContainerHeaderBehavior sticky={sticky} scrollAware={scrollAware} transparent={transparent} glass={glass}>
      {inner}
    </ContainerHeaderBehavior>
  );
}
