import { PhoneCall } from "lucide-react";
import React from "react";
import type { CTABlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { BqLink, bqStyle } from "@/components/blocks/_primitives/boutique";
import { InlineLabel } from "../inline-label";
import { ctaLabelField } from "./cta-label-field";

/**
 * Boutique Banner: small spaced-out label, serif title, optional text and pill
 * buttons, all centred. The photo and its overlay are the section's own
 * Background (image + overlay colour) and height comes from the Style panel,
 * so a client swaps the picture without touching the copy. "Text at top"
 * pins the copy to the top edge (poster-style banners).
 */
export function CTABoutiqueBanner({ data, blockId }: { data: CTABlockProps["data"]; blockId?: string }) {
  const light = data.tone !== "dark";
  const glass = !!data.glassBox;
  const pill = data.buttonStyle === "call-pill";
  const inner = (
    <>
      {data.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.logoUrl} alt={data.title || ""} className="mx-auto mb-6 w-auto object-contain" style={{ height: data.logoHeight ?? 110 }} />
      )}
      {data.eyebrow && (glass
        ? <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold tracking-widest uppercase"><i className="w-2 h-2 rounded-full bg-white" /><InlineLabel blockId={blockId} field="eyebrow" value={data.eyebrow} /></span>
        : <span className="bq-eyebrow mb-4" style={{ opacity: .9 }}><InlineLabel blockId={blockId} field="eyebrow" value={data.eyebrow} /></span>)}
      {data.title && <h2 className={cn(glass ? "font-black mt-5 mb-0 text-2xl sm:text-3xl" : "bq-h m-0 text-[26px] sm:text-[34px]")}><InlineLabel blockId={blockId} field="title" value={data.title} /></h2>}
      {data.description && <p className={cn("mt-4 mb-0 text-[15px] leading-relaxed opacity-90 max-w-[34rem] mx-auto whitespace-pre-line", glass && "mt-3 text-base leading-7 opacity-75 max-w-2xl", data.justify && "text-justify")}><InlineLabel blockId={blockId} field="description" value={data.description} /></p>}
      {(data.primaryButton?.label || data.secondaryButton?.label) && (
        <div className={cn("flex flex-wrap gap-3 justify-center", glass ? "mt-7" : "mt-8")}>
          {data.primaryButton?.label && (pill ? (
            <a href={data.primaryButton.url || "#"} className="inline-flex items-center gap-4 rounded-full bg-white px-5 sm:px-7 py-4 font-black shadow-lg" style={{ color: data.colors?.accent || "#173a70" }}>
              <span className="w-11 h-11 rounded-full grid place-items-center text-white" style={{ background: data.colors?.accent || "#25477f" }}><PhoneCall className="w-5 h-5" /></span>
              <span className="text-left">
                {data.buttonKicker && <span className="block text-[10px] tracking-widest uppercase"><InlineLabel blockId={blockId} field="buttonKicker" value={data.buttonKicker} /></span>}
                <span className="block text-lg sm:text-xl"><InlineLabel blockId={blockId} field="primaryButton.label" value={data.primaryButton.label} /></span>
              </span>
            </a>
          ) : (
            <BqLink href={data.primaryButton.url || "#"} className="bq-btn"
              style={data.buttonStyle === "light" ? { background: "#EFEFEF", color: "#202020", letterSpacing: ".4px", fontSize: 16, fontWeight: 400, padding: "10px 22px" } : undefined}>
              <InlineLabel blockId={blockId} field="primaryButton.label" value={data.primaryButton.label} />
            </BqLink>
          ))}
          {data.secondaryButton?.label && (
            <BqLink href={data.secondaryButton.url || "#"} className="bq-btn" style={{ background: "transparent", border: `1px solid ${light ? "#fff" : "currentColor"}`, color: "inherit" }}><InlineLabel blockId={blockId} field={ctaLabelField(data, "secondaryButton")} value={data.secondaryButton.label} /></BqLink>
          )}
        </div>
      )}
    </>
  );
  return (
    <div className={cn("bq w-full flex flex-col items-center text-center px-4", data.contentPosition === "top" ? "justify-start" : "justify-center")}
      style={bqStyle(data.colors, { color: data.colors?.dark ?? (light ? "#fff" : undefined), minHeight: "inherit" })}>
      {glass
        ? <div className="w-full max-w-7xl rounded-3xl border border-white/15 bg-white/10 px-5 py-9 sm:px-10 sm:py-12">{inner}</div>
        : <div className="max-w-3xl">{inner}</div>}
    </div>
  );
}
