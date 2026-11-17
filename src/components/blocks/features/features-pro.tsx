import React from "react";
import type { FeaturesBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ProFrame, ProHeading, ProIcon, ProLink, isDarkSection, proRoot } from "@/components/blocks/_primitives/pro";

type Item = FeaturesBlockProps["data"]["items"][number];

function ItemLink({ item }: { item: Item }) {
  if (!item.buttonLabel || !item.buttonUrl) return null;
  return <ProLink href={item.buttonUrl} className="pcx-link mt-4">{item.buttonLabel}<span aria-hidden="true">→</span></ProLink>;
}

const spanClass: Record<string, string> = { "1": "", "2": "md:col-span-2", "3": "md:col-span-2 lg:col-span-3" };

/**
 * Features "Pro Bento": tiles of mixed widths in a three-column grid. A tile
 * with a picture shows it in a small window under its text; a tile's Width
 * (1, 2 or 3 columns) is set per item, and defaults to 2 for tiles with a
 * picture. The item's small label becomes a chip (e.g. "Free").
 */
export function FeaturesProBento({ block }: { block: FeaturesBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block, data.tone);
  const items = data.items ?? [];
  return (
    <section className={proRoot(dark)}>
      <div className="pcx-wrap">
        <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} align={data.layout === "centered" ? "center" : "left"} />
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const span = item.span ?? (item.imageUrl ? "2" : "1");
            const wide = span !== "1" && !!item.imageUrl;
            return (
              <article key={item.id} className={cn("pcx-card relative flex flex-col overflow-hidden", spanClass[span], wide && "lg:flex-row")}>
                <div className={cn("p-6 sm:p-7 flex flex-col", wide && "lg:w-[42%] lg:shrink-0")}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <ProIcon name={item.icon} className="w-6 h-6 pcx-accent-text" />
                    {item.label && <span className="pcx-chip !py-0.5 !text-xs">{item.label}</span>}
                  </div>
                  <h3 className="pcx-h3">{item.title}</h3>
                  {item.description && <p className="pcx-small mt-2 !text-[0.9375rem]">{item.description}</p>}
                  <ItemLink item={item} />
                </div>
                {item.imageUrl && (
                  <div className={cn("mt-auto px-6 sm:px-7", wide ? "lg:px-0 lg:pt-7 lg:flex-1 lg:min-w-0 lg:self-end" : "")}>
                    <ProFrame src={item.imageUrl} alt={item.title} ratio={wide ? 1.5 : 1.7} bare
                      className={cn("!rounded-b-none !border-b-0 !shadow-none", wide && "lg:!rounded-tr-none lg:!border-r-0")} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {!!data.buttons?.length && (
          <div className="mt-10 flex flex-wrap gap-3">
            {data.buttons.map((b) => <ProLink key={b.id} href={b.url} className={cn("pcx-btn", b.style === "outline" ? "pcx-btn-outline" : "pcx-btn-primary")}>{b.label}</ProLink>)}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Features "Pro Grid": no cards. A left-aligned heading, then items in
 * columns, each under a hairline: icon, title, text and an optional link.
 * For lists of six or more points where cards would be noise.
 */
export function FeaturesProGrid({ block }: { block: FeaturesBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block, data.tone);
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section className={proRoot(dark)}>
      <div className="pcx-wrap">
        <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} align={data.layout === "centered" ? "center" : "left"} />
        <div className={cn("grid grid-cols-1 gap-x-8 gap-y-10", cols)}>
          {(data.items ?? []).map((item) => (
            <div key={item.id} className="pt-6 border-t" style={{ borderColor: "var(--pcx-line-strong)" }}>
              <ProIcon name={item.icon} className="w-6 h-6 pcx-accent-text mb-4" />
              <h3 className="pcx-h3">{item.title}</h3>
              {item.description && <p className="pcx-small mt-2 !text-[0.9375rem]">{item.description}</p>}
              <ItemLink item={item} />
            </div>
          ))}
        </div>
        {!!data.buttons?.length && (
          <div className="mt-10 flex flex-wrap gap-3">
            {data.buttons.map((b) => <ProLink key={b.id} href={b.url} className={cn("pcx-btn", b.style === "outline" ? "pcx-btn-outline" : "pcx-btn-primary")}>{b.label}</ProLink>)}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Features "Pro Split": the heading and intro on one side with a framed
 * picture under it, a checklist of the items on the other. For "why this is
 * safe to choose" sections that need one picture and a short list.
 */
export function FeaturesProSplit({ block }: { block: FeaturesBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block, data.tone);
  return (
    <section className={proRoot(dark)}>
      <div className="pcx-wrap grid grid-cols-1 gap-10 lg:gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <ProHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} className="!mb-0" />
          {data.description && <p className="pcx-body mt-4">{data.description}</p>}
          {!!data.buttons?.length && (
            <div className="mt-8 flex flex-wrap gap-3">
              {data.buttons.map((b) => <ProLink key={b.id} href={b.url} className={cn("pcx-btn", b.style === "outline" ? "pcx-btn-outline" : "pcx-btn-primary")}>{b.label}</ProLink>)}
            </div>
          )}
          {data.imageUrl && <ProFrame src={data.imageUrl} alt={data.title} ratio={1.6} className="mt-10" />}
        </div>
        <ul className="m-0 p-0 list-none">
          {(data.items ?? []).map((item, i) => (
            <li key={item.id} className={cn("flex gap-4 py-5", i > 0 && "border-t")} style={{ borderColor: "var(--pcx-line)" }}>
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--pcx-accent-soft)" }}>
                <ProIcon name={item.icon || "Check"} className="w-[1.125rem] h-[1.125rem] pcx-accent-text" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h3 className="pcx-h3 !text-base">{item.title}</h3>
                {item.description && <p className="pcx-small mt-1">{item.description}</p>}
                <ItemLink item={item} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
