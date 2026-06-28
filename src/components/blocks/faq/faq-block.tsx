"use client";

import React, { useState } from "react";
import type { FAQBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function FAQBlock({ block }: { block: FAQBlockProps }) {
  const { data } = block;
  const { title, subtitle, layout, items, allowMultiple } = data;
  const [open, setOpen] = useState<string[]>([]);

  const toggle = (id: string) => {
    setOpen(prev =>
      allowMultiple
        ? prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        : prev.includes(id) ? [] : [id]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {layout === "grid" ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold mb-2">{item.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
            </div>
          ))}
        </div>
      ) : layout === "simple" ? (
        <div className="space-y-6">
          {items.map(item => (
            <div key={item.id} className="border-b pb-6">
              <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const isOpen = open.includes(item.id);
            return (
              <div key={item.id} className={cn("border rounded-lg overflow-hidden", isOpen && "border-primary/30")}>
                <button
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/40 transition-colors"
                >
                  {item.question}
                  <ChevronDown className={cn("w-4 h-4 shrink-0 ml-3 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t bg-muted/20">
                    <div className="pt-3">{item.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
