"use client";

import { Search } from "lucide-react";
import { SearchSuggestions } from "@/components/site/search-suggestions";
import type { SearchBlockProps } from "@/types/cms";

/**
 * Search box with live suggestions. One block for both places it is used:
 * the header builder (compact, `variant` pill/plain/icon-less) and pages
 * (optional heading above a wider box). What it searches, in what order and
 * how many suggestions it shows are set on the block.
 */
export function SearchBlock({ block }: { block: SearchBlockProps }) {
  const d = block.data;
  const types = d.types?.length ? d.types : undefined;
  const style = d.style ?? "pill";
  const align = d.align ?? "left";
  const width = d.maxWidth ?? (d.title ? 640 : 420);

  return (
    <div className={align === "center" ? "text-center" : align === "right" ? "text-right" : ""}>
      {d.title && <h2 className="text-2xl sm:text-3xl font-bold mb-2">{d.title}</h2>}
      {d.subtitle && <p className="text-muted-foreground mb-5">{d.subtitle}</p>}
      <form action="/search" role="search"
        className={[
          "relative flex items-center w-full gap-2 text-left",
          align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : "",
          style === "pill" ? "rounded-full bg-white border border-black/10 pl-4 pr-1 py-1 shadow-sm text-neutral-800"
            : style === "boxed" ? "rounded-lg bg-white border border-black/15 pl-3 pr-1 py-1 text-neutral-800"
            : "border-b border-current/30 py-1.5",
        ].join(" ")}
        style={{ maxWidth: width }}>
        {types && <input type="hidden" name="in" value={types.join(",")} />}
        <Search className="h-4 w-4 shrink-0 opacity-60" />
        <input name="q" placeholder={d.placeholder || "Search"} aria-label="Search"
          className="flex-1 min-w-0 bg-transparent px-1.5 py-1.5 text-sm outline-none placeholder:opacity-70" />
        {style !== "plain" && d.showButton !== false && (
          <button className={`${style === "pill" ? "rounded-full" : "rounded-md"} px-5 py-2 text-xs font-semibold uppercase tracking-wide shrink-0`}
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
            {d.buttonLabel || "Search"}
          </button>
        )}
        <SearchSuggestions types={types} limit={d.limit ?? 5} />
      </form>
    </div>
  );
}
