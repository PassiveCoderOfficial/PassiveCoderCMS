import React from "react";
import type { StepsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

function DynIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : null;
}

// ─── Variant: timeline-connected ─────────────────────────────────────────────
// Vertical timeline: a continuous line down the left with circular numbered
// nodes on it, title+description to the right — "how it works" processes.
function StepsTimelineConnected({ block }: { block: StepsBlockProps }) {
  const { data } = block;
  const { title, subtitle, items } = data;
  return (
    <div className="max-w-3xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />
        <div className="space-y-10">
          {items.map((item, i) => (
            <div key={item.id} className="relative flex items-start gap-6">
              <div className="relative z-10 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-lg shadow-primary/20 ring-4 ring-background">
                {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : item.number ?? String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 pt-1.5">
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                {item.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>}
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="mt-3 rounded-lg w-full max-w-xs object-cover" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Variant: numbered-cards ──────────────────────────────────────────────────
// Horizontal row of bordered cards (wraps to grid on mobile), each with a huge
// faded oversized step number in the corner — distinct from the legacy
// "connected"/"card" style branches.
function StepsNumberedCards({ block }: { block: StepsBlockProps }) {
  const { data } = block;
  const { title, subtitle, items } = data;
  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div key={item.id} className="relative overflow-hidden rounded-2xl border bg-card p-6 pt-10">
            <span
              aria-hidden
              className="absolute -top-3 right-3 text-7xl font-black text-primary/10 select-none leading-none"
            >
              {item.number ?? String(i + 1).padStart(2, "0")}
            </span>
            <div className="relative z-10">
              {item.icon && (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <DynIcon name={item.icon} className="w-5 h-5 text-primary" />
                </div>
              )}
              <h3 className="font-semibold text-lg mb-1.5">{item.title}</h3>
              {item.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepsHead({ title, subtitle, align = "center" }: { title?: string; subtitle?: string; align?: "center" | "left" }) {
  if (!title && !subtitle) return null;
  return (
    <div className={cn("mb-12", align === "center" ? "text-center" : "text-left")}>
      {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
      {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/** Steps are ordered by definition, so the displayed number falls back to
 *  position when the author hasn't set one explicitly. */
function stepNumber(item: { number?: string }, i: number) {
  return item.number ?? String(i + 1);
}

// ─── Variant: vertical-line ───────────────────────────────────────────────────
// Left rail with markers running down it — natural for processes with more
// than four steps, where a horizontal row would cramp.
function StepsVerticalLine({ block }: { block: StepsBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-3xl mx-auto">
      <StepsHead title={title} subtitle={subtitle} align="left" />
      <div className="relative pl-10">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-9">
          {items.map((item, i) => (
            <div key={item.id} className="relative">
              <span className="absolute -left-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {stepNumber(item, i)}
              </span>
              <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
              {item.description && <p className="text-muted-foreground leading-relaxed mt-1.5">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Variant: big-numbers ─────────────────────────────────────────────────────
// Oversized ghosted numerals behind each step — editorial and confident.
function StepsBigNumbers({ block }: { block: StepsBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <StepsHead title={title} subtitle={subtitle} />
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.id} className="relative pt-6">
            <span className="absolute top-0 left-0 text-6xl font-black text-primary/10 leading-none select-none">
              {stepNumber(item, i)}
            </span>
            <div className="relative">
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              {item.description && <p className="text-muted-foreground leading-relaxed">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: icon-row ────────────────────────────────────────────────────────
// Icon-led rather than number-led — for processes where the *what* matters
// more than the order.
function StepsIconRow({ block }: { block: StepsBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <StepsHead title={title} subtitle={subtitle} />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <DynIcon name={item.icon} className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1.5">{item.title}</h3>
            {item.description && <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: dark-cards ──────────────────────────────────────────────────────
// Numbered cards on lifted surfaces, tuned for dark palettes.
function StepsDarkCards({ block }: { block: StepsBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <StepsHead title={title} subtitle={subtitle} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.id} className="rounded-xl bg-foreground/5 border-l-2 border-primary p-6">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Step {stepNumber(item, i)}
            </span>
            <h3 className="font-semibold text-lg mt-2 mb-1.5">{item.title}</h3>
            {item.description && <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: arrow-flow ──────────────────────────────────────────────────────
// Chevrons between steps make the sequence unmistakable — good for booking
// and onboarding flows.
function StepsArrowFlow({ block }: { block: StepsBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <StepsHead title={title} subtitle={subtitle} />
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        {items.map((item, i) => (
          <React.Fragment key={item.id}>
            <div className="flex-1 rounded-xl border bg-card p-5 text-center">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mb-2.5">
                {stepNumber(item, i)}
              </span>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
            </div>
            {i < items.length - 1 && (
              <span className="hidden lg:block shrink-0 text-2xl text-primary/40 leading-none">›</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: split-media ─────────────────────────────────────────────────────
// Alternating rows pairing each step with its image. For processes worth
// showing, not just telling — renovations, treatments, builds.
function StepsSplitMedia({ block }: { block: StepsBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-5xl mx-auto">
      <StepsHead title={title} subtitle={subtitle} />
      <div className="space-y-12">
        {items.map((item, i) => (
          <div key={item.id} className={cn("flex flex-col gap-6 sm:flex-row sm:items-center", i % 2 === 1 && "sm:flex-row-reverse")}>
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.title} className="w-full sm:w-2/5 h-52 object-cover rounded-xl" loading="lazy" />
            ) : (
              <div className="w-full sm:w-2/5 h-52 rounded-xl bg-primary/5 flex items-center justify-center">
                <span className="text-5xl font-black text-primary/20">{stepNumber(item, i)}</span>
              </div>
            )}
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Step {stepNumber(item, i)}</span>
              <h3 className="text-xl font-bold mt-1.5 mb-2">{item.title}</h3>
              {item.description && <p className="text-muted-foreground leading-relaxed">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepsBlock({ block }: { block: StepsBlockProps }) {
  switch (block.templateVariant) {
    case "timeline-connected": return <StepsTimelineConnected block={block} />;
    case "numbered-cards": return <StepsNumberedCards block={block} />;
    case "vertical-line": return <StepsVerticalLine block={block} />;
    case "big-numbers": return <StepsBigNumbers block={block} />;
    case "icon-row": return <StepsIconRow block={block} />;
    case "dark-cards": return <StepsDarkCards block={block} />;
    case "arrow-flow": return <StepsArrowFlow block={block} />;
    case "split-media": return <StepsSplitMedia block={block} />;
  }
  const { data } = block;
  const { title, subtitle, layout, items, style } = data;

  return (
    <div className="max-w-5xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {layout === "horizontal" ? (
        <div className="flex flex-col sm:flex-row items-start gap-0">
          {items.map((item, i) => (
            <div key={item.id} className="flex-1 flex flex-col items-center text-center relative">
              {style === "connected" && i < items.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-1/2 w-full h-0.5 bg-primary/20" />
              )}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3 relative z-10",
                style === "plain" ? "bg-primary/10 text-primary border-2 border-primary" : "bg-primary text-primary-foreground",
              )}>
                {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : item.number ?? (i + 1)}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              {item.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, i) => (
            <div key={item.id} className={cn(
              "flex items-start gap-5",
              style === "card" && "bg-card border rounded-xl p-5 shadow-sm",
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                "bg-primary text-primary-foreground",
              )}>
                {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : item.number ?? (i + 1)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                {item.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>}
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="mt-3 rounded-lg w-full max-w-xs object-cover" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
