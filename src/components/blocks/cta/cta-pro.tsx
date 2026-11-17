import React from "react";
import type { CTABlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { InlineText } from "../inline-text";
import { ProButton, isDarkSection, linkIcon, proRoot } from "@/components/blocks/_primitives/pro";
import { CommandLine } from "@/components/blocks/_primitives/pro-copy";

/**
 * CTA "Pro Band": one sentence and two buttons on the section's own
 * Background (no card, no gradient). Centred, or split with the buttons on
 * the right. An optional command line sits under the buttons, for software
 * with a one-line install. Light or dark text follows the Background.
 */
export function CTAProBand({ block }: { block: CTABlockProps }) {
  const { data } = block;
  const dark = isDarkSection(block, data.tone === "light" ? "dark" : data.tone === "dark" ? "light" : undefined);
  const split = data.layout === "split";
  const buttons = (
    <div className={cn("flex flex-wrap items-center gap-3", !split && data.layout !== "left" && "justify-center")}>
      <ProButton large href={data.primaryButton?.url} label={data.primaryButton?.label} kind="primary" icon={linkIcon(data.primaryButton?.url)} />
      <ProButton large href={data.secondaryButton?.url} label={data.secondaryButton?.label} kind="outline" icon={linkIcon(data.secondaryButton?.url)} />
      <ProButton large href={data.tertiaryButton?.url} label={data.tertiaryButton?.label} kind="outline" />
    </div>
  );
  const text = (
    <>
      {data.eyebrow && <p className="pcx-eyebrow mb-4">{data.eyebrow}</p>}
      <h2 className="pcx-h2"><InlineText blockId={block.id} field="title" value={data.title} /></h2>
      {data.description && <p className="pcx-lead mt-4"><InlineText blockId={block.id} field="description" value={data.description} /></p>}
    </>
  );
  return (
    <section className={proRoot(dark, "relative isolate")}>
      <div className="pcx-wrap">
        {split ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
            <div className="max-w-[40rem]">{text}</div>
            <div className="flex flex-col gap-5 lg:items-end">
              {buttons}
              {data.command?.trim() && <CommandLine command={data.command.trim()} />}
            </div>
          </div>
        ) : (
          <div className={cn("flex flex-col gap-8", data.layout === "left" ? "items-start max-w-[44rem]" : "items-center text-center mx-auto max-w-[46rem]")}>
            <div>{text}</div>
            {buttons}
            {data.command?.trim() && <CommandLine command={data.command.trim()} />}
          </div>
        )}
      </div>
    </section>
  );
}
