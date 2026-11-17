import React from "react";
import { Check } from "lucide-react";
import type { HeroBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { InlineText } from "../inline-text";
import { orderElements } from "@/components/blocks/_primitives/ordered-elements";
import { ProButton, ProFrame, ProLink, isDarkSection, linkIcon, proRoot } from "@/components/blocks/_primitives/pro";
import { CommandLine } from "@/components/blocks/_primitives/pro-copy";

/**
 * Hero "Product": for software and services that have something to show.
 * Label chip, large title with an accent line, lead, two buttons and a text
 * link, an optional copyable command, small tick points, and a screenshot in
 * a browser frame (below the text when centred, beside it when split).
 * Light or dark text follows the section Background.
 */
export function HeroProduct({ block }: { block: HeroBlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block);
  const split = data.layout === "split" || data.layout === "right" || data.layout === "left";
  const center = !split;
  const bullets = (data.bullets ?? []).filter((b) => b?.trim());
  const stats = (data.statRow ?? []).filter((s) => s.value || s.label);

  const text = (
    <div className={cn("flex flex-col gap-6", center ? "items-center text-center mx-auto max-w-[60rem]" : "items-start max-w-[36rem]")}>
      {orderElements(block.elements, {
        badge: data.badge ? (
          <span className="pcx-chip"><span className="pcx-chip-dot" aria-hidden="true" /><InlineText blockId={block.id} field="badge" value={data.badge} /></span>
        ) : null,
        title: (
          <h1 className={cn("pcx-h1", split && "!text-[clamp(2.25rem,4.2vw,3.5rem)]")} style={{ color: data.typography?.titleColor || undefined }}>
            <InlineText blockId={block.id} field="title" value={data.title} />
            {data.titleAccent && (
              <>
                {" "}
                <span className={cn("pcx-accent-text", split ? "block mt-2 !text-[0.62em] !leading-[1.15] tracking-[-0.02em]" : "sm:block")}><InlineText blockId={block.id} field="titleAccent" value={data.titleAccent} /></span>
              </>
            )}
          </h1>
        ),
        subtitle: data.subtitle ? (
          <p className={cn("pcx-lead", center && "max-w-[42rem]")} style={{ color: data.typography?.subtitleColor || undefined }}>
            <InlineText blockId={block.id} field="subtitle" value={data.subtitle} />
          </p>
        ) : null,
        description: data.description ? (
          <p className={cn("pcx-body", center && "max-w-[40rem]")} style={{ color: data.typography?.descColor || undefined }}>
            <InlineText blockId={block.id} field="description" value={data.description} />
          </p>
        ) : null,
        buttons: (data.primaryButton?.label || data.secondaryButton?.label || data.tertiaryButton?.label) ? (
          <div className={cn("flex flex-wrap items-center gap-3 pt-1", center && "justify-center")}>
            <ProButton large href={data.primaryButton?.url} label={data.primaryButton?.label} kind="primary" icon={linkIcon(data.primaryButton?.url)} />
            <ProButton large href={data.secondaryButton?.url} label={data.secondaryButton?.label} kind="outline" icon={linkIcon(data.secondaryButton?.url)} />
            {data.tertiaryButton?.label && (
              <ProLink href={data.tertiaryButton.url || "#"} className="pcx-link px-2 py-2">{data.tertiaryButton.label}<span aria-hidden="true">→</span></ProLink>
            )}
          </div>
        ) : null,
      })}
      {data.command?.trim() && <CommandLine command={data.command.trim()} />}
      {bullets.length > 0 && (
        <ul className={cn("flex flex-wrap gap-x-6 gap-y-2 m-0 p-0 list-none", center && "justify-center")}>
          {bullets.map((b, i) => (
            <li key={i} className="pcx-small inline-flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" style={{ color: "var(--pcx-accent-ink)" }} strokeWidth={2.25} aria-hidden />{b}
            </li>
          ))}
        </ul>
      )}
      {stats.length > 0 && (
        <dl className={cn("grid w-full grid-cols-2 gap-x-8 gap-y-5 m-0 pt-6 border-t sm:[grid-template-columns:repeat(var(--pcx-n),minmax(0,1fr))]", center ? "max-w-[44rem] text-center" : "text-left")}
          style={{ borderColor: "var(--pcx-line)", ["--pcx-n" as string]: String(Math.min(stats.length, 4)) }}>
          {stats.map((s) => (
            <div key={s.id} className="min-w-0">
              <dt className="sr-only">{s.label}</dt>
              <dd className="m-0 text-[1.5rem] sm:text-[1.75rem] font-bold leading-none tracking-tight" style={{ color: "var(--pcx-fg)" }}>{s.value}</dd>
              <dd className="m-0 mt-1.5 text-[0.8125rem] leading-snug" style={{ color: "var(--pcx-sub)" }} aria-hidden="true">{s.label}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );

  const frame = data.imageUrl ? (
    <div className="relative">
      <div className="pcx-glow absolute -inset-x-10 -inset-y-10 -z-10 pointer-events-none" aria-hidden="true" />
      <ProFrame src={data.imageUrl} alt={data.imageAlt} url={data.frameUrl} ratio={data.imageRatio || 1.6} eager bare={data.frameUrl === "none"} />
    </div>
  ) : null;

  return (
    <section className={proRoot(dark, "relative isolate overflow-x-clip")}>
      <div className="pcx-grid-bg absolute inset-x-0 -top-10 h-[34rem] -z-10 pointer-events-none" aria-hidden="true" />
      <div className="pcx-wrap">
        {center ? (
          <>
            {text}
            {frame && <div className="mt-12 sm:mt-16 mx-auto max-w-[68rem]">{frame}</div>}
          </>
        ) : (
          <div className="grid grid-cols-1 items-center gap-12 lg:gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className={cn(data.layout === "right" && "lg:order-2")}>{text}</div>
            {frame}
          </div>
        )}
      </div>
    </section>
  );
}
