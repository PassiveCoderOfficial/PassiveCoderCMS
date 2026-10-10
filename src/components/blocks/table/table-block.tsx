import React from "react";
import type { TableBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

/**
 * Data table: fee lists, schedules, price comparisons. Rows and columns are
 * edited in the builder (or pasted from Excel). On phones the table either
 * scrolls sideways with a sticky first column, or each row becomes a card.
 */
export function TableBlock({ block }: { block: TableBlockProps }) {
  const { data } = block;
  const cols = data.columns ?? [];
  const rows = (data.rows ?? []).filter((r) => r.some((c) => String(c ?? "").trim()));
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

        <div className={cn("rounded-2xl border border-border bg-card overflow-x-auto", cards && "hidden md:block")}>
          <table className="w-full text-sm text-card-foreground border-collapse">
            <thead>
              <tr>
                {cols.map((c, i) => (
                  <th key={i} scope="col" className={cn("px-4 py-3 text-left font-semibold text-white whitespace-nowrap align-bottom", i === 0 && firstHead && "sticky left-0 z-10")} style={{ background: head }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={cn("border-t border-border", data.striped !== false && ri % 2 === 1 && "bg-muted/40")}>
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

        {data.note && <p className="mt-3 text-xs text-muted-foreground whitespace-pre-line">{data.note}</p>}
      </div>
    </section>
  );
}
