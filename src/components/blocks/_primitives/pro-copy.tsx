"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copy-to-clipboard button; shows a tick for a moment. `label` is read by screen readers. */
export function CopyButton({ text, label = "Copy", copiedLabel = "Copied", className, showText }: { text: string; label?: string; copiedLabel?: string; className?: string; showText?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* clipboard blocked: nothing to do */ }
  };
  return (
    <button type="button" onClick={copy} className={className} aria-label={done ? copiedLabel : label}>
      {done ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
      {showText && <span aria-live="polite">{done ? copiedLabel : label}</span>}
    </button>
  );
}

/** One command on a line with a copy button, e.g. under a hero's buttons. */
export function CommandLine({ command, copyLabel, copiedLabel }: { command: string; copyLabel?: string; copiedLabel?: string }) {
  return (
    <div className="pcx-cmd">
      <span aria-hidden="true" style={{ color: "var(--pcx-accent-ink)" }}>$</span>
      <code>{command}</code>
      <CopyButton text={command} label={copyLabel || "Copy command"} copiedLabel={copiedLabel} />
    </div>
  );
}
