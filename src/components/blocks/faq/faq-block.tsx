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

/** Shared section heading so every variant introduces itself the same way. */
function SectionHead({ title, subtitle, align = "center" }: {
  title?: string; subtitle?: string; align?: "center" | "left";
}) {
  if (!title && !subtitle) return null;
  return (
    <div className={cn("mb-10", align === "center" ? "text-center" : "text-left")}>
      {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
      {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// ─── Variant: numbered-list ───────────────────────────────────────────────────
// Questions numbered like a reference document — reads as thorough and
// methodical. Suits legal, financial and technical services.
function NumberedList({ block }: { block: FAQBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-3xl mx-auto">
      <SectionHead title={title} subtitle={subtitle} align="left" />
      <div className="space-y-8">
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-5">
            <span className="shrink-0 text-2xl font-bold text-primary/40 tabular-nums leading-none pt-0.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-semibold text-lg mb-1.5">{item.question}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: split-heading ───────────────────────────────────────────────────
// Heading pinned left, questions scroll right — editorial, works well when the
// section title carries weight of its own.
function SplitHeading({ block }: { block: FAQBlockProps }) {
  const { title, subtitle, items, allowMultiple } = block.data;
  const { open, toggle } = useAccordionState(allowMultiple);
  return (
    <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
        {subtitle && <p className="text-muted-foreground leading-relaxed">{subtitle}</p>}
      </div>
      <div className="divide-y divide-border">
        {items.map(item => {
          const isOpen = open.includes(item.id);
          return (
            <div key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-start justify-between gap-4 py-5 text-left font-semibold"
              >
                <span>{item.question}</span>
                <ChevronDown className={cn("w-5 h-5 shrink-0 mt-0.5 text-muted-foreground transition-transform", isOpen && "rotate-180 text-primary")} />
              </button>
              <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: cards-grid ──────────────────────────────────────────────────────
// Every answer visible in its own card. Good when answers are short and you
// want the section to read as scannable rather than interactive.
function CardsGrid({ block }: { block: FAQBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <SectionHead title={title} subtitle={subtitle} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <div key={item.id} className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-2 leading-snug">{item.question}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: dark-accordion ──────────────────────────────────────────────────
// Accordion tuned for dark palettes — surfaces lift off the background rather
// than relying on borders that vanish on dark.
function DarkAccordion({ block }: { block: FAQBlockProps }) {
  const { title, subtitle, items, allowMultiple } = block.data;
  const { open, toggle } = useAccordionState(allowMultiple);
  return (
    <div className="max-w-4xl mx-auto">
      <SectionHead title={title} subtitle={subtitle} />
      <div className="space-y-2.5">
        {items.map(item => {
          const isOpen = open.includes(item.id);
          return (
            <div key={item.id} className={cn("rounded-xl overflow-hidden transition-colors bg-foreground/5", isOpen && "bg-foreground/10 ring-1 ring-primary/30")}>
              <button
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
              >
                <span>{item.question}</span>
                <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", isOpen ? "rotate-180 text-primary" : "text-muted-foreground")} />
              </button>
              <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: minimal-lines ───────────────────────────────────────────────────
// Hairline rules, no cards, no chrome — the quietest treatment. Suits
// typography-led and luxury brands.
function MinimalLines({ block }: { block: FAQBlockProps }) {
  const { title, subtitle, items, allowMultiple } = block.data;
  const { open, toggle } = useAccordionState(allowMultiple);
  return (
    <div className="max-w-3xl mx-auto">
      <SectionHead title={title} subtitle={subtitle} />
      <div>
        {items.map(item => {
          const isOpen = open.includes(item.id);
          return (
            <div key={item.id} className="border-b border-border">
              <button
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 py-4 text-left"
              >
                <span className="font-medium">{item.question}</span>
                <span className={cn("shrink-0 text-lg leading-none text-muted-foreground transition-transform", isOpen && "rotate-45 text-primary")}>+</span>
              </button>
              <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variant: boxed-two-column ────────────────────────────────────────────────
// Two columns of bordered boxes, all answers open. Dense and reassuring when
// there are many short questions.
function BoxedTwoColumn({ block }: { block: FAQBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-5xl mx-auto">
      <SectionHead title={title} subtitle={subtitle} />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(item => (
          <div key={item.id} className="border-l-2 border-primary/50 bg-muted/40 rounded-r-lg px-4 py-3.5">
            <h3 className="font-semibold text-sm mb-1.5">{item.question}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.answer}</p>
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

  switch (block.templateVariant) {
    case "accordion-bordered": return <AccordionBordered block={block} />;
    case "two-column-grid": return <TwoColumnGrid block={block} />;
    case "numbered-list": return <NumberedList block={block} />;
    case "split-heading": return <SplitHeading block={block} />;
    case "cards-grid": return <CardsGrid block={block} />;
    case "dark-accordion": return <DarkAccordion block={block} />;
    case "minimal-lines": return <MinimalLines block={block} />;
    case "boxed-two-column": return <BoxedTwoColumn block={block} />;
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
            <div key={item.id} className="bg-card border rounded-xl p-5">
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
