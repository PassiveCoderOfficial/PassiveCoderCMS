"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Shared color picker (build once, reuse everywhere) ──────────────────────
// Single control for every color field in the CMS. Base color via the native
// picker + an alpha/transparency slider. Value is a CSS color string:
// - 6-digit hex "#rrggbb" when fully opaque
// - 8-digit hex "#rrggbbaa" when transparent
// Both are valid CSS and round-trip cleanly. Fixing/improving this one place
// updates every color field across the app.

function parseColor(value: string): { hex: string; alpha: number } {
  const v = (value || "").trim();
  const m = /^#?([0-9a-fA-F]{3,8})$/.exec(v);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 4) h = h.split("").map((c) => c + c).join(""); // #rgba shorthand
    const hex = "#" + h.slice(0, 6).padEnd(6, "0");
    const alpha = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { hex, alpha };
  }
  // rgba(r,g,b,a) — normalize to hex + alpha
  const rgba = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/.exec(v);
  if (rgba) {
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    const hex = `#${toHex(+rgba[1])}${toHex(+rgba[2])}${toHex(+rgba[3])}`;
    return { hex, alpha: rgba[4] !== undefined ? Math.max(0, Math.min(1, +rgba[4])) : 1 };
  }
  return { hex: "#000000", alpha: 1 };
}

function toValue(hex: string, alpha: number): string {
  if (alpha >= 1) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `${hex}${a}`;
}

export function ColorPicker({
  value,
  onChange,
  allowAlpha = true,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  allowAlpha?: boolean;
  className?: string;
}) {
  const { hex, alpha } = parseColor(value);
  const swatchBg = toValue(hex, alpha);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 h-8 rounded-md border bg-background px-2 text-xs w-full",
            className,
          )}
        >
          {/* Checkerboard so transparency reads clearly */}
          <span
            className="h-4 w-4 rounded border shrink-0 bg-[length:8px_8px] bg-[position:0_0,4px_4px]"
            style={{
              backgroundColor: swatchBg,
              backgroundImage:
                "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%,#ccc),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%,#ccc)",
            }}
          />
          <span className="truncate flex-1 text-left font-mono">{value || "—"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 space-y-3" align="start">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(toValue(e.target.value, alpha))}
            className="h-9 w-9 rounded border cursor-pointer p-0.5 shrink-0"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs font-mono"
            placeholder="#000000"
          />
        </div>
        {allowAlpha && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Transparency</span>
              <span>{Math.round(alpha * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(e) => onChange(toValue(hex, parseFloat(e.target.value)))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, transparent, ${hex})`,
              }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
