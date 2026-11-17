"use client";

import React, { useMemo, useState } from "react";
import { Search, Download, Printer } from "lucide-react";
import type { TableBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { TableCompare } from "./table-compare";

function csvOf(cols: string[], rows: string[][]) {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return "\uFEFF" + [cols, ...rows].map((r) => r.map((c) => esc(String(c ?? ""))).join(",")).join("\r\n");
}

/**
 * Data table: fee lists, schedules, price comparisons. Rows and columns are
 * edited in the builder (or pasted from Excel). On phones the table either
 * scrolls sideways with a sticky first column, or each row becomes a card.
 * Long tables (e.g. rows from a collection) can add a search box, pages and
 * CSV / print downloads.
 */
/** Comparison design: its own renderer; every other table is the classic one below. */
export function TableBlock({ block }: { block: TableBlockProps }) {
  if (block.data.design === "compare") return <TableCompare block={block} />;
  return <TableClassic block={block} />;
}

function TableClassic({ block }: { block: TableBlockProps }) {
  const { data } = block;
  const cols = data.columns ?? [];
  const allRows = useMemo(() => (data.rows ?? []).filter((r) => r.some((c) => String(c ?? "").trim())), [data.rows]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allRows.filter((r) => r.some((c) => String(c ?? "").toLowerCase().includes(q))) : allRows;
  }, [allRows, query]);
  const size = data.pageSize && data.pageSize > 0 ? data.pageSize : 0;
  const pages = size ? Math.max(1, Math.ceil(matched.length / size)) : 1;
  const current = Math.min(page, pages - 1);
  const rows = size ? matched.slice(current * size, current * size + size) : matched;
  const tools = data.searchable || data.exportable;
  const download = () => {
    const url = URL.createObjectURL(new Blob([csvOf(cols, matched)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${(data.title || "table").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const cell = (v: string) => String(v ?? "").replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]!));
    w.document.write(`<html><head><title>${cell(data.title || "Table")}</title><style>body{font:12px system-ui;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#eee}</style></head><body><h2>${cell(data.title || "")}</h2><table><thead><tr>${cols.map((c) => `<th>${cell(c)}</th>`).join("")}</tr></thead><tbody>${matched.map((r) => `<tr>${cols.map((_, i) => `<td>${cell(r[i])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
    w.document.close(); w.focus(); w.print();
  };
  // " of " between counts: one text node with its spaces, as the old literal.
  const ofWord = ` ${data.ofLabel || "of"} `;
  const head = data.headerColor || "hsl(var(--primary))";
  const firstHead = data.firstColumnHeader !== false;
  const cards = data.mobileLayout === "cards";

  return (
    <section className="px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {(data.eyebrow || data.title || data.subtitle) && (
          <div className="mb-8">
            {data.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: head }}>{data.eyebrow}</p>}
            {data.title && <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{data.title}</h2>}
            {data.subtitle && <p className="mt-2 text-muted-foreground">{data.subtitle}</p>}
          </div>
        )}

        {tools && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {data.searchable && (
              <div className="relative flex-1 min-w-52 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={data.searchPlaceholder || "Search…"} aria-label="Search the table"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            )}
            {data.searchable && query && <span className="text-xs text-muted-foreground">{matched.length}{ofWord}{allRows.length}</span>}
            {data.exportable && (
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"><Download className="w-4 h-4" />{data.csvLabel || "CSV"}</button>
                <button type="button" onClick={print} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"><Printer className="w-4 h-4" />{data.printLabel || "Print / PDF"}</button>
              </div>
            )}
          </div>
        )}

        <div className={cn("rounded-2xl border border-border bg-card overflow-x-auto", cards && "hidden md:block")}>
          <table className="w-full text-sm text-card-foreground border-collapse">
            {!data.hideHeader && cols.some((c) => String(c ?? "").trim()) && <thead>
              <tr>
                {cols.map((c, i) => (
                  <th key={i} scope="col" className={cn("px-4 py-3 text-left font-semibold text-white whitespace-nowrap align-bottom", i === 0 && firstHead && "sticky left-0 z-10")} style={{ background: head }}>{c}</th>
                ))}
              </tr>
            </thead>}
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={cn(!(data.hideHeader && ri === 0) && "border-t border-border", data.striped !== false && ri % 2 === 1 && "bg-muted/40")}>
                  {cols.map((_, ci) => {
                    const v = r[ci] ?? "";
                    return ci === 0 && firstHead ? (
                      <th key={ci} scope="row" className={cn("px-4 py-3 text-left font-semibold sticky left-0 z-10 min-w-40", data.striped !== false && ri % 2 === 1 ? "bg-muted" : "bg-card")}>{v}</th>
                    ) : (
                      <td key={ci} className="px-4 py-3 align-top min-w-28 whitespace-pre-line">{v}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cards && (
          <div className="md:hidden space-y-4">
            {rows.map((r, ri) => (
              <div key={ri} className="rounded-2xl border border-border bg-card overflow-hidden text-card-foreground">
                <p className="px-4 py-3 font-semibold text-white" style={{ background: head }}>{firstHead ? r[0] : `${cols[0] ?? ""}: ${r[0] ?? ""}`}</p>
                <dl className="divide-y divide-border">
                  {cols.slice(1).map((c, ci) => (r[ci + 1] ?? "").trim() ? (
                    <div key={ci} className="px-4 py-2.5 flex justify-between gap-4 text-sm">
                      <dt className="text-muted-foreground">{c}</dt>
                      <dd className="font-medium text-right whitespace-pre-line">{r[ci + 1]}</dd>
                    </div>
                  ) : null)}
                </dl>
              </div>
            ))}
          </div>
        )}

        {size > 0 && pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{current * size + 1}–{Math.min(matched.length, (current + 1) * size)}{ofWord}{matched.length}</span>
            <div className="flex gap-2">
              <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-40 hover:bg-muted">{data.prevLabel || "Previous"}</button>
              <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-40 hover:bg-muted">{data.nextLabel || "Next"}</button>
            </div>
          </div>
        )}

        {data.note && <p className="mt-3 text-xs text-muted-foreground whitespace-pre-line">{data.note}</p>}
      </div>
    </section>
  );
}
