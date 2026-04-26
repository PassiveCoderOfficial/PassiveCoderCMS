import React from "react";
import type { DividerBlockProps } from "@/types/cms";

export function DividerBlock({ block }: { block: DividerBlockProps }) {
  const { data } = block;
  const { style, color, thickness, width } = data;

  const widthClass = { full: "w-full", wide: "max-w-7xl mx-auto", normal: "max-w-5xl mx-auto" }[width] ?? "w-full";

  if (style === "wave") {
    return (
      <div className={widthClass}>
        <svg viewBox="0 0 1200 30" xmlns="http://www.w3.org/2000/svg" style={{ fill: color }}>
          <path d="M0,15 C300,0 600,30 900,15 C1050,7.5 1150,7.5 1200,15 L1200,30 L0,30 Z" />
        </svg>
      </div>
    );
  }

  const borderStyle = ({ solid: "solid", dashed: "dashed", dotted: "dotted", wave: "solid", zigzag: "solid" } as Record<string, string>)[style] ?? "solid";
  return (
    <div className={widthClass}>
      <hr style={{ borderColor: color, borderTopStyle: borderStyle as never, borderTopWidth: thickness }} />
    </div>
  );
}
