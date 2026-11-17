"use client";

import React, { useId, useRef, useState } from "react";
import type { CodeBlockProps, CodeTab } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ProButton, ProHeading, isDarkSection, linkIcon, proRoot } from "@/components/blocks/_primitives/pro";
import { CopyButton } from "@/components/blocks/_primitives/pro-copy";

/** What the copy button copies: a terminal's commands without the "$ " prompt or the output, a file whole. */
export function copyText(tab: CodeTab): string {
  if (tab.kind !== "terminal") return tab.code;
  const cmds = tab.code.split("\n").filter((l) => l.startsWith("$ ")).map((l) => l.slice(2));
  return (cmds.length ? cmds : tab.code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"))).join("\n");
}

/** One line, lightly coloured: comments dim, the prompt in the brand colour, terminal output green. */
function Line({ text, terminal }: { text: string; terminal: boolean }) {
  if (/^\s*(#|\/\/)/.test(text)) return <span className="tk-c">{text}</span>;
  if (terminal && text.startsWith("$ ")) return <><span className="tk-p">$ </span>{text.slice(2)}</>;
  if (terminal && text.trim()) return <span className="tk-o">{text}</span>;
  return <>{text}</>;
}

/**
 * Code and terminal: one dark window with tabs (a terminal session, a config
 * file, a second install path), each with a copy button. Beside or above it:
 * a heading, numbered steps and buttons. Keyboard: arrow keys move between
 * tabs. Every tab's text is in the page from the start (no loading), only the
 * visible panel changes.
 */
export function CodeBlock({ block }: { block: CodeBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block);
  const tabs = (data.tabs ?? []).filter((t) => t.code?.trim());
  const [active, setActive] = useState(0);
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.min(active, Math.max(0, tabs.length - 1));
  const split = data.layout !== "stacked";
  const steps = (data.steps ?? []).filter((s) => s.title?.trim());

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (current + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  const win = tabs.length ? (
    <div className="pcx-code min-w-0">
      <div className="pcx-code-bar">
        <div role="tablist" aria-label={data.title || "Code"} className="flex items-center gap-1" onKeyDown={onKey}>
          {tabs.map((t, i) => (
            <button key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${uid}-t${i}`} aria-controls={`${uid}-p${i}`}
              aria-selected={i === current} tabIndex={i === current ? 0 : -1} onClick={() => setActive(i)} className="pcx-code-tab">{t.label}</button>
          ))}
        </div>
        <CopyButton text={copyText(tabs[current])} label={data.copyLabel || "Copy"} copiedLabel={data.copiedLabel || "Copied"} showText className="pcx-code-copy" />
      </div>
      {tabs.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`${uid}-p${i}`} aria-labelledby={`${uid}-t${i}`} hidden={i !== current} tabIndex={0}>
          <pre><code>{t.code.split("\n").map((l, li) => <React.Fragment key={li}><Line text={l} terminal={t.kind === "terminal"} />{"\n"}</React.Fragment>)}</code></pre>
        </div>
      ))}
    </div>
  ) : null;

  const stepList = steps.length ? (
    <ol className="m-0 p-0 list-none grid gap-6">
      {steps.map((s, i) => (
        <li key={s.id} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold" style={{ borderColor: "var(--pcx-line-strong)", color: "var(--pcx-fg)", fontFamily: "var(--pcx-mono)" }}>{i + 1}</span>
          <div className="min-w-0 pt-0.5">
            <h3 className="pcx-h3 !text-base">{s.title}</h3>
            {s.description && <p className="pcx-small mt-1">{s.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  ) : null;

  const buttons = (data.primaryButton?.label || data.secondaryButton?.label) ? (
    <div className="flex flex-wrap gap-3 mt-8">
      <ProButton href={data.primaryButton?.url} label={data.primaryButton?.label} kind="primary" icon={linkIcon(data.primaryButton?.url)} />
      <ProButton href={data.secondaryButton?.url} label={data.secondaryButton?.label} kind="outline" icon={linkIcon(data.secondaryButton?.url)} />
    </div>
  ) : null;

  return (
    <section className={proRoot(dark)}>
      <div className="pcx-wrap">
        {split ? (
          <div className="grid grid-cols-1 gap-10 lg:gap-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div>
              <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} className="!mb-8" />
              {stepList}
              {buttons}
            </div>
            <div className="min-w-0 lg:sticky lg:top-28">
              {win}
              {data.note && <p className="pcx-small mt-3">{data.note}</p>}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[56rem]">
            <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} align="center" />
            {stepList && <div className={cn("mb-10", "sm:[&>ol]:grid-cols-3")}>{stepList}</div>}
            {win}
            {data.note && <p className="pcx-small mt-3 text-center">{data.note}</p>}
            {buttons && <div className="flex justify-center">{buttons}</div>}
          </div>
        )}
      </div>
    </section>
  );
}
