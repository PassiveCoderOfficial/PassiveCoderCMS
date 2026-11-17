import React from "react";
import { Check, Minus, X } from "lucide-react";
import type { TableBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ProButton, ProHeading, isDarkSection, proRoot, yesNo } from "@/components/blocks/_primitives/pro";

/** Cell text, or a tick / cross / dash when the cell says yes / no / partial. "Yes: note" keeps the note. */
function Cell({ value, yes, no }: { value: string; yes: string; no: string }) {
  const [head, ...rest] = value.split(":");
  const kind = yesNo(rest.length ? head : value);
  const note = kind && rest.length ? rest.join(":").trim() : "";
  if (!kind) return <span className="whitespace-pre-line">{value}</span>;
  return (
    <span className="inline-flex items-start gap-2">
      {kind === "yes" && <Check className="w-[1.125rem] h-[1.125rem] shrink-0 mt-0.5 pcx-accent-text" strokeWidth={2.5} aria-hidden />}
      {kind === "no" && <X className="w-[1.125rem] h-[1.125rem] shrink-0 mt-0.5" style={{ color: "var(--pcx-faint)" }} strokeWidth={2} aria-hidden />}
      {kind === "partial" && <Minus className="w-[1.125rem] h-[1.125rem] shrink-0 mt-0.5" style={{ color: "var(--pcx-faint)" }} strokeWidth={2} aria-hidden />}
      {note ? <span>{note}</span> : <span className="sr-only">{kind === "yes" ? yes : kind === "no" ? no : value}</span>}
    </span>
  );
}

/**
 * Table "Comparison" design: for "this versus that" tables. Cells that say
 * yes / no become a tick or a cross (add a note after a colon: "Yes: daily"),
 * one column can be highlighted, each column can carry a small note under its
 * heading and a button under the table, and a row with only its first cell
 * filled is a group heading. On phones the table scrolls sideways inside its
 * frame with the first column pinned, or turns into one card per column.
 */
export function TableCompare({ block }: { block: TableBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block);
  const cols = data.columns ?? [];
  const rows = (data.rows ?? []).filter((r) => r.some((c) => String(c ?? "").trim()));
  const hi = data.highlightColumn && data.highlightColumn > 0 && data.highlightColumn < cols.length ? data.highlightColumn : -1;
  const notes = data.columnNotes ?? [];
  const buttons = data.columnButtons ?? [];
  const hasButtons = buttons.some((b) => b?.label);
  const yes = data.yesLabel || "Yes";
  const no = data.noLabel || "No";
  const isGroup = (r: string[]) => !!String(r[0] ?? "").trim() && r.slice(1).every((c) => !String(c ?? "").trim());
  const cards = data.mobileLayout === "cards";
  const hiBg = "var(--pcx-accent-soft)";
  const colWidth = `${Math.floor(64 / Math.max(1, cols.length - 1))}%`;

  return (
    <section className={proRoot(dark)} style={dark && block.background?.type === "color" && block.background.color ? ({ "--pcx-sticky": block.background.color } as React.CSSProperties) : undefined}>
      <div className={cn("pcx-wrap", cols.length <= 3 && "!max-w-[64rem]")}>
        <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />

        <div className={cn("pcx-card overflow-x-auto", cards && "hidden md:block")}>
          <table className="w-full border-collapse text-left text-[0.9375rem] leading-snug" style={{ minWidth: cols.length > 3 ? "44rem" : "34rem" }}>
            <colgroup>
              <col />
              {cols.slice(1).map((_, i) => <col key={i} style={{ width: colWidth }} />)}
            </colgroup>
            <thead>
              <tr>
                {cols.map((c, i) => (
                  <th key={i} scope="col" className={cn("px-4 sm:px-6 pt-5 pb-4 align-bottom font-semibold", i === 0 && "sticky left-0 z-10")}
                    style={{ background: i === hi ? hiBg : i === 0 ? "var(--pcx-sticky, hsl(var(--card)))" : undefined, borderBottom: "1px solid var(--pcx-line-strong)", color: "var(--pcx-fg)" }}>
                    <span className="block text-base">{c}</span>
                    {notes[i] && <span className="pcx-small block mt-1 font-normal">{notes[i]}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => isGroup(r) ? (
                <tr key={ri}>
                  <th scope="colgroup" colSpan={cols.length} className="px-4 sm:px-6 pt-6 pb-2 text-left">
                    <span className="pcx-eyebrow !text-xs" style={{ color: "var(--pcx-faint)" }}>{r[0]}</span>
                  </th>
                </tr>
              ) : (
                <tr key={ri}>
                  {cols.map((_, ci) => ci === 0 ? (
                    <th key={ci} scope="row" className="sticky left-0 z-10 px-4 sm:px-6 py-3.5 align-top font-medium min-w-[9.5rem]"
                      style={{ background: "var(--pcx-sticky, hsl(var(--card)))", borderTop: "1px solid var(--pcx-line)", color: "var(--pcx-fg)" }}>{r[0]}</th>
                  ) : (
                    <td key={ci} className="px-4 sm:px-6 py-3.5 align-top" style={{ background: ci === hi ? hiBg : undefined, borderTop: "1px solid var(--pcx-line)", color: "var(--pcx-sub)" }}>
                      <Cell value={String(r[ci] ?? "")} yes={yes} no={no} />
                    </td>
                  ))}
                </tr>
              ))}
              {hasButtons && (
                <tr>
                  <td className="sticky left-0 z-10" style={{ background: "var(--pcx-sticky, hsl(var(--card)))", borderTop: "1px solid var(--pcx-line)" }} />
                  {cols.slice(1).map((_, i) => {
                    const b = buttons[i + 1];
                    return (
                      <td key={i} className="px-4 sm:px-6 py-5 align-top" style={{ background: i + 1 === hi ? hiBg : undefined, borderTop: "1px solid var(--pcx-line)" }}>
                        {b?.label && <ProButton href={b.url} label={b.label} kind={i + 1 === hi ? "primary" : "outline"} />}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {cards && (
          <div className="md:hidden grid gap-4">
            {cols.slice(1).map((c, i) => {
              const ci = i + 1;
              const b = buttons[ci];
              return (
                <div key={ci} className="pcx-card overflow-hidden" style={ci === hi ? { borderColor: "var(--pcx-accent)" } : undefined}>
                  <div className="px-5 py-4" style={{ background: ci === hi ? hiBg : "var(--pcx-soft)", borderBottom: "1px solid var(--pcx-line)" }}>
                    <p className="m-0 font-semibold text-base" style={{ color: "var(--pcx-fg)" }}>{c}</p>
                    {notes[ci] && <p className="pcx-small m-0 mt-0.5">{notes[ci]}</p>}
                  </div>
                  <dl className="m-0">
                    {rows.map((r, ri) => isGroup(r) ? (
                      <div key={ri} className="px-5 pt-4 pb-1"><span className="pcx-eyebrow !text-xs" style={{ color: "var(--pcx-faint)" }}>{r[0]}</span></div>
                    ) : (
                      <div key={ri} className="px-5 py-3 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 text-sm" style={{ borderTop: ri ? "1px solid var(--pcx-line)" : undefined }}>
                        <dt className="font-medium" style={{ color: "var(--pcx-fg)" }}>{r[0]}</dt>
                        <dd className="m-0" style={{ color: "var(--pcx-sub)" }}><Cell value={String(r[ci] ?? "")} yes={yes} no={no} /></dd>
                      </div>
                    ))}
                  </dl>
                  {b?.label && <div className="px-5 py-4" style={{ borderTop: "1px solid var(--pcx-line)" }}><ProButton href={b.url} label={b.label} kind={ci === hi ? "primary" : "outline"} className="w-full" /></div>}
                </div>
              );
            })}
          </div>
        )}

        {data.note && <p className="pcx-small mt-4 whitespace-pre-line">{data.note}</p>}
      </div>
    </section>
  );
}
