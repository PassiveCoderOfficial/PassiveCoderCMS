"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_PRESETS, focusToCss, focusXY, normalizeFocus, type ImageFocus } from "@/lib/image-focus";

const LABELS: Record<string, string> = {
  "top-left": "Top left", top: "Top", "top-right": "Top right",
  left: "Left", center: "Center", right: "Right",
  "bottom-left": "Bottom left", bottom: "Bottom", "bottom-right": "Bottom right",
};

/**
 * The one focal-point control: 9-position grid presets plus "Custom" (click
 * the image to set the point), with a live preview of how the crop looks in
 * a wide and a tall frame. Used wherever a cropped image is picked
 * (MediaPickerInput's focus props) and for the section-wide focus.
 */
export function ImageFocusPicker({ value, onChange, imageUrl, label = "Image focus", hint }: {
  value?: ImageFocus | null;
  onChange: (v: ImageFocus | undefined) => void;
  imageUrl?: string;
  label?: string;
  hint?: string;
}) {
  const f = normalizeFocus(value);
  const [open, setOpen] = useState(false);
  const [x, y] = focusXY(f);
  const pos = focusToCss(f) ?? "50% 50%";

  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onChange({ focus: "custom", x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) });
  };

  return (
    <div className="rounded-md border bg-muted/20 p-2 space-y-2">
      <button type="button" className="flex w-full items-center justify-between text-xs" onClick={() => setOpen((o) => !o)}>
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{f ? (f.focus === "custom" ? `Custom ${x}% / ${y}%` : LABELS[f.focus]) : "Default"} {open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <>
          {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
          <div className="flex gap-2 items-start">
            <div className="grid grid-cols-3 gap-0.5 shrink-0" role="radiogroup" aria-label={label}>
              {FOCUS_PRESETS.map((p) => (
                <button key={p} type="button" title={LABELS[p]} aria-label={LABELS[p]} aria-checked={f?.focus === p} role="radio"
                  onClick={() => onChange({ focus: p })}
                  className={cn("h-6 w-6 rounded-sm border flex items-center justify-center", f?.focus === p ? "bg-primary border-primary" : "bg-background hover:bg-muted")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", f?.focus === p ? "bg-primary-foreground" : "bg-muted-foreground/50")} />
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              <button type="button" onClick={() => onChange({ focus: "custom", x, y })}
                className={cn("rounded border px-2 py-0.5", f?.focus === "custom" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>Custom</button>
              <button type="button" onClick={() => onChange(undefined)} className="rounded border px-2 py-0.5 hover:bg-muted">Default</button>
            </div>
          </div>
          {f?.focus === "custom" && (
            <div className="flex gap-2 text-[11px] items-center">
              <label className="flex items-center gap-1">X <input type="number" min={0} max={100} value={x} className="w-12 h-6 border rounded px-1 bg-background"
                onChange={(e) => onChange({ focus: "custom", x: Number(e.target.value), y })} />%</label>
              <label className="flex items-center gap-1">Y <input type="number" min={0} max={100} value={y} className="w-12 h-6 border rounded px-1 bg-background"
                onChange={(e) => onChange({ focus: "custom", x, y: Number(e.target.value) })} />%</label>
            </div>
          )}
          {imageUrl && (
            <>
              <p className="text-[10px] text-muted-foreground">Click the photo to set a custom focal point.</p>
              <div className="flex justify-center"><div className="relative inline-block cursor-crosshair select-none" onClick={pick}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="block max-w-full max-h-56 w-auto h-auto rounded" draggable={false} />
                {f && <span className="pointer-events-none absolute h-3 w-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white bg-primary shadow" style={{ left: `${x}%`, top: `${y}%` }} />}
              </div></div>
              <div className="flex gap-2 items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-2/3 aspect-video object-cover rounded border" style={{ objectPosition: pos }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-1/4 aspect-[3/4] object-cover rounded border" style={{ objectPosition: pos }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Crop preview: wide and tall frames.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
