"use client";

import React, { useEffect, useRef, useState } from "react";
import type { StatsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

function DynIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : null;
}

function useCountUp(target: number, animate: boolean, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (!animate || ref.current) return;
    ref.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, animate, duration]);
  return animate ? count : target;
}

type StatItem = StatsBlockProps["data"]["items"][number];

// ─── Variant: colored-row ─────────────────────────────────────────────────────
// Primary tinted background, row layout — cleaning
function StatsColoredRow({ data }: { data: StatsBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[data.columns] ?? "sm:grid-cols-4";
  return (
    <div className="max-w-6xl mx-auto">
      <div className={cn("grid grid-cols-2 gap-px bg-primary/20 rounded-xl overflow-hidden", colClass)}>
        {data.items.map((item) => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, data.animate);
          const display = data.animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div key={item.id} className="stat-value-wrap bg-card flex flex-col items-center text-center p-8">
              <p className="stat-value text-4xl md:text-5xl font-extrabold text-primary tracking-tight">{display}</p>
              <p className="text-sm mt-1.5 text-muted-foreground font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: plain-dark ──────────────────────────────────────────────────────
// No cards, plain text on dark bg — spa/luxury
function StatsPlainDark({ data }: { data: StatsBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[data.columns] ?? "sm:grid-cols-4";
  return (
    <div className="max-w-5xl mx-auto">
      <div className={cn("grid grid-cols-2 gap-8", colClass)}>
        {data.items.map((item) => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, data.animate);
          const display = data.animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div key={item.id} className="flex flex-col items-center text-center">
              <p className="stat-value text-5xl font-light text-primary">{display}</p>
              <div className="w-8 h-px bg-primary/40 my-3" />
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: navy-row ────────────────────────────────────────────────────────
// Navy background row — law firm
function StatsNavyRow({ data }: { data: StatsBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[data.columns] ?? "sm:grid-cols-4";
  return (
    <div className="max-w-6xl mx-auto">
      <div className={cn("grid grid-cols-2 gap-8", colClass)}>
        {data.items.map((item) => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, data.animate);
          const display = data.animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div key={item.id} className="text-center">
              <p className="stat-value text-4xl md:text-5xl font-bold text-primary">{display}</p>
              <p className="text-sm mt-2 text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: gradient-numbers ────────────────────────────────────────────────
// Gradient text values — tech agency dark
function StatsGradientNumbers({ data }: { data: StatsBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[data.columns] ?? "sm:grid-cols-4";
  return (
    <div className="max-w-6xl mx-auto">
      <div className={cn("grid grid-cols-2 gap-8", colClass)}>
        {data.items.map((item) => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, data.animate);
          const display = data.animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div key={item.id} className="flex flex-col items-center text-center p-6 border border-border rounded-xl">
              {item.icon && (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <DynIcon name={item.icon} className="w-5 h-5 text-primary" />
                </div>
              )}
              <p className="stat-value text-4xl md:text-5xl font-black text-primary">{display}</p>
              <p className="text-xs mt-2 text-muted-foreground uppercase tracking-widest font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: bold-dark-row ────────────────────────────────────────────────────
// Bold, uppercase, dark — gym
function StatsBoldDarkRow({ data }: { data: StatsBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[data.columns] ?? "sm:grid-cols-4";
  return (
    <div className="max-w-6xl mx-auto">
      <div className={cn("grid grid-cols-2 gap-1 bg-border", colClass)}>
        {data.items.map((item) => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, data.animate);
          const display = data.animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div key={item.id} className="bg-card flex flex-col items-center text-center p-8">
              <p className="stat-value text-5xl font-black text-primary">{display}</p>
              <p className="text-xs mt-2 uppercase tracking-[0.15em] text-muted-foreground font-semibold">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: warm-row ────────────────────────────────────────────────────────
// Warm tones — restaurant
function StatsWarmRow({ data }: { data: StatsBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[data.columns] ?? "sm:grid-cols-4";
  return (
    <div className="max-w-5xl mx-auto">
      <div className={cn("grid grid-cols-2 gap-8", colClass)}>
        {data.items.map((item) => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, data.animate);
          const display = data.animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div key={item.id} className="text-center">
              <p className="stat-value text-4xl md:text-5xl font-bold text-primary italic">{display}</p>
              <div className="w-12 h-0.5 bg-primary/30 mx-auto my-3" />
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: dark-band ───────────────────────────────────────────────────────
// Full-bleed solid brand-color band, white text, vertical dividers between
// cells — manufacturing/corporate/B2B.
function StatsDarkBand({ data }: { data: StatsBlockProps["data"] }) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[data.columns] ?? "sm:grid-cols-4";
  return (
    <div className="w-full bg-primary">
      <div className={cn("max-w-6xl mx-auto grid grid-cols-2", colClass)}>
        {data.items.map((item, i) => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, data.animate);
          const display = data.animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div
              key={item.id}
              className={cn(
                "px-6 py-8 text-center border-white/10",
                i < data.items.length - 1 && "border-r",
              )}
            >
              <p className="stat-value text-3xl font-black text-primary-foreground">{display}</p>
              <p className="text-primary-foreground/60 text-xs mt-1.5 font-medium uppercase tracking-wider">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Legacy fallback ──────────────────────────────────────────────────────────

function StatsLegacy({ data }: { data: StatsBlockProps["data"] }) {
  const { title, subtitle, layout, columns, items, style, animate } = data;
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-2 gap-6", layout === "row" ? "sm:grid-cols-4" : colClass)}>
        {items.map(item => {
          const num = parseInt(item.value.replace(/\D/g, "")) || 0;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const count = useCountUp(num, animate);
          const display = animate && num > 0 ? `${item.prefix ?? ""}${count.toLocaleString()}${item.suffix ?? ""}` : item.value;
          return (
            <div key={item.id} className={cn(
              "flex flex-col items-center text-center p-6",
              style === "cards" && "bg-white border rounded-xl shadow-sm",
              style === "colored" && "bg-primary text-primary-foreground rounded-xl",
            )}>
              {item.icon && (
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", style === "colored" ? "bg-white/20" : "bg-primary/10")}>
                  <DynIcon name={item.icon} className={cn("w-6 h-6", style === "colored" ? "text-primary-foreground" : "text-primary")} />
                </div>
              )}
              <p className="text-4xl font-bold tracking-tight">{display}</p>
              <p className={cn("text-sm mt-1", style === "colored" ? "text-primary-foreground/80" : "text-muted-foreground")}>{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function StatsBlock({ block }: { block: StatsBlockProps }) {
  const variant = block.templateVariant;
  if (variant === "colored-row") return <StatsColoredRow data={block.data} />;
  if (variant === "plain-dark") return <StatsPlainDark data={block.data} />;
  if (variant === "navy-row") return <StatsNavyRow data={block.data} />;
  if (variant === "gradient-numbers") return <StatsGradientNumbers data={block.data} />;
  if (variant === "bold-dark-row") return <StatsBoldDarkRow data={block.data} />;
  if (variant === "warm-row") return <StatsWarmRow data={block.data} />;
  if (variant === "dark-band") return <StatsDarkBand data={block.data} />;
  return <StatsLegacy data={block.data} />;
}
