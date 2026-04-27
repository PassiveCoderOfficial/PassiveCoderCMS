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

function StatCard({ item, style, animate }: { item: { id: string; value: string; label: string; prefix?: string; suffix?: string; icon?: string }; style: string; animate: boolean }) {
  const numericValue = parseInt(item.value.replace(/\D/g, "")) || 0;
  const animCount = useCountUp(numericValue, animate);
  const displayValue = animate && numericValue > 0
    ? `${item.prefix ?? ""}${animCount.toLocaleString()}${item.suffix ?? ""}`
    : item.value;

  return (
    <div className={cn(
      "flex flex-col items-center text-center p-6",
      style === "cards" && "bg-white border rounded-xl shadow-sm",
      style === "colored" && "bg-primary text-primary-foreground rounded-xl",
    )}>
      {item.icon && (
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3",
          style === "colored" ? "bg-white/20" : "bg-primary/10"
        )}>
          <DynIcon name={item.icon} className={cn("w-6 h-6", style === "colored" ? "text-primary-foreground" : "text-primary")} />
        </div>
      )}
      <p className="text-4xl font-bold tracking-tight">{displayValue}</p>
      <p className={cn("text-sm mt-1", style === "colored" ? "text-primary-foreground/80" : "text-muted-foreground")}>{item.label}</p>
    </div>
  );
}

export function StatsBlock({ block }: { block: StatsBlockProps }) {
  const { data } = block;
  const { title, subtitle, layout, columns, items, style, animate } = data;

  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn(
        "grid grid-cols-2 gap-6",
        layout === "row" ? "sm:grid-cols-4" : colClass,
      )}>
        {items.map(item => <StatCard key={item.id} item={item} style={style} animate={animate} />)}
      </div>
    </div>
  );
}
