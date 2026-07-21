"use client";

import React, { useState } from "react";
import type { FAQBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

function useAccordionState(allowMultiple: boolean) {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (id: string) => {
    setOpen(prev =>
      allowMultiple
        ? prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        : prev.includes(id) ? [] : [id]
    );
  };
  return { open, toggle };
}

function AccordionBordered({ block }: { block: FAQBlockProps }) {
  const { data } = block;
  const { title, subtitle, items, allowMultiple } = data;
  const { open, toggle } = useAccordionState(allowMultiple);

  return (
    <div className="max-w-4xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">
        {items.map(item => {
          const isOpen = open.includes(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                "border rounded-xl overflow-hidden transition-colors",
                isOpen ? "border-primary/40 shadow-sm" : "border-border"
              )}
            >
              <button
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold hover:bg-muted/40 transition-colors"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180 text-primary"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/10">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TwoColumnGrid({ block }: { block: FAQBlockProps }) {
  const { data } = block;
  const { title, subtitle, items } = data;

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        {items.map(item => (
          <div key={item.id}>
            <h3 className="font-bold text-lg mb-2">{item.question}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FAQBlock({ block }: { block: FAQBlockProps }) {
  const { data } = block;
  const { title, subtitle, layout, items, allowMultiple } = data;
  const { open, toggle } = useAccordionState(allowMultiple);

  if (block.templateVariant === "accordion-bordered") {
    return <AccordionBordered block={block} />;
  }
  if (block.templateVariant === "two-column-grid") {
    return <TwoColumnGrid block={block} />;
  }

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
