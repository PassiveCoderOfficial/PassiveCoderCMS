import React from "react";
import type { IconGridBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Box } from "lucide-react";

function DynIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return <Box className={className} />;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : <Box className={className} />;
}

const SIZE_CLASS = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" };
const ICON_SIZE = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

export function IconGridBlock({ block }: { block: IconGridBlockProps }) {
  const { data } = block;
  const { title, subtitle, columns, items, style, iconSize } = data;

  const colClass: Record<number, string> = {
    3: "grid-cols-3",
    4: "sm:grid-cols-4",
    5: "grid-cols-3 sm:grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-6",
  };

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-6", colClass[columns] ?? "grid-cols-4")}>
        {items.map(item => {
          const iconBg = item.color ? `${item.color}20` : undefined;
          const iconColor = item.color ?? undefined;
          const content = (
            <>
              <div
                className={cn("rounded-xl flex items-center justify-center mx-auto mb-3", SIZE_CLASS[iconSize])}
                style={style === "colored" ? { backgroundColor: iconBg } : undefined}
              >
                <span style={{ color: iconColor }}>
                  <DynIcon name={item.icon} className={cn(ICON_SIZE[iconSize])} />
                </span>
              </div>
              <p className="text-sm font-semibold text-center">{item.label}</p>
              {item.description && <p className="text-xs text-muted-foreground text-center mt-1">{item.description}</p>}
            </>
          );

          return item.url ? (
            <a key={item.id} href={item.url} className={cn(
              "flex flex-col items-center py-5 px-3 rounded-xl transition-colors hover:bg-muted/50",
              style === "card" && "bg-white border shadow-sm hover:shadow-md",
            )}>
              {content}
            </a>
          ) : (
            <div key={item.id} className={cn(
              "flex flex-col items-center py-5 px-3 rounded-xl",
              style === "card" && "bg-white border shadow-sm",
            )}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
