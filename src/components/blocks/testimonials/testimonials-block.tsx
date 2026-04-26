import React from "react";
import type { TestimonialsBlockProps } from "@/types/cms";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function TestimonialsBlock({ block }: { block: TestimonialsBlockProps }) {
  const { data } = block;
  const { title, layout, items } = data;

  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
      <div className={cn("grid grid-cols-1 gap-6", layout !== "carousel" && "md:grid-cols-3")}>
        {items.map((item) => (
          <div key={item.id} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col">
            {item.rating && (
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < item.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200")} />
                ))}
              </div>
            )}
            <blockquote className="text-sm text-gray-700 flex-1 leading-relaxed">"{item.content}"</blockquote>
            <div className="mt-4 flex items-center gap-3">
              {item.avatar ? (
                <img src={item.avatar} alt={item.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  {item.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                {(item.role || item.company) && (
                  <p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
