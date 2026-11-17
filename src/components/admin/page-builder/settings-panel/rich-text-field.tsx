"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link2, Unlink, Heading2, Heading3, Pilcrow, RemoveFormatting, Code } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTrialSanitizer } from "@/components/admin/trial-site-context";

/**
 * Rich text for block content (Text, Side-by-Side Text): paragraphs, two
 * heading sizes, bold / italic / underline, lists and links, plus an HTML
 * view for anything the toolbar doesn't cover (tables, images, embeds).
 *
 * The saved HTML is only rewritten when the editor actually types or uses
 * the toolbar, so opening a block never changes its content. Pasted text
 * arrives as plain paragraphs so outside styling can't sneak in.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain pasted text as paragraphs: blank lines split paragraphs, single line breaks stay. */
export function plainTextToHtml(text: string): string {
  return text.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
}

const TOOLS: { cmd: string; arg?: string; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { cmd: "formatBlock", arg: "p", icon: Pilcrow, label: "Paragraph" },
  { cmd: "formatBlock", arg: "h2", icon: Heading2, label: "Heading" },
  { cmd: "formatBlock", arg: "h3", icon: Heading3, label: "Small heading" },
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "underline", icon: Underline, label: "Underline" },
  { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
];

export function RichTextField({ label, value, onChange, hint, minHeight = 180 }: {
  label: string; value: string; onChange: (html: string) => void; hint?: string; minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(false);
  // innerHTML last written into / read from the editor, so outside changes
  // (undo, AI rewrite, another tab) are picked up without fighting the typist.
  const synced = useRef<string | null>(null);
  // Trial site: saved HTML is put into the editor sanitised, so opening the
  // panel never runs it (lib/security/trial-html.ts). Nothing is written
  // while the sanitiser is still loading.
  const trialGuard = useTrialSanitizer();

  useEffect(() => {
    const el = ref.current;
    if (!el || html) return;
    if (!trialGuard.ready) return;
    if (synced.current === value) return;
    if (document.activeElement === el) return;
    el.innerHTML = trialGuard.lib ? trialGuard.lib.sanitizeTrialHtml(value ?? "") : value ?? "";
    synced.current = value ?? "";
  }, [value, html, trialGuard.ready, trialGuard.lib]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const next = el.textContent?.trim() || el.querySelector("img,li,table,iframe,hr") ? el.innerHTML : "";
    synced.current = next;
    if (next !== value) onChange(next);
  };

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link address (e.g. /contact or https://...)");
    if (!url) return;
    run("createLink", url.trim());
  };

  const btn = "w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40";

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="rounded-md border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-1 py-0.5" role="toolbar" aria-label="Text formatting">
          {TOOLS.map((t) => (
            <button key={t.label} type="button" title={t.label} aria-label={t.label} disabled={html} className={btn}
              onMouseDown={(e) => { e.preventDefault(); run(t.cmd, t.arg); }}>
              <t.icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <button type="button" title="Add link" aria-label="Add link" disabled={html} className={btn} onMouseDown={(e) => { e.preventDefault(); addLink(); }}>
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="Remove link" aria-label="Remove link" disabled={html} className={btn} onMouseDown={(e) => { e.preventDefault(); run("unlink"); }}>
            <Unlink className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="Clear formatting" aria-label="Clear formatting" disabled={html} className={btn} onMouseDown={(e) => { e.preventDefault(); run("removeFormat"); }}>
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
          <button type="button" title={html ? "Back to the text editor" : "Edit HTML"} aria-pressed={html}
            className={cn(btn, "ml-auto w-auto px-1.5 gap-1 text-[10px] font-semibold", html && "bg-primary/10 text-primary")}
            onClick={() => { synced.current = null; setHtml((v) => !v); }}>
            <Code className="w-3.5 h-3.5" /> HTML
          </button>
        </div>
        {html ? (
          <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} spellCheck={false}
            className="block w-full text-xs font-mono p-2 resize-y bg-background focus:outline-none" style={{ minHeight }} />
        ) : (
          <div
            ref={ref}
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              if (!text) return;
              document.execCommand("insertHTML", false, plainTextToHtml(text) || esc(text));
              emit();
            }}
            className="prose prose-sm max-w-none px-3 py-2 text-sm overflow-y-auto focus:outline-none [&_a]:text-primary [&_a]:underline"
            style={{ minHeight, maxHeight: 480 }}
          />
        )}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
