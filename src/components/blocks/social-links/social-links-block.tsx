"use client";

import React from "react";
import type { SocialLinksBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { useSiteContact } from "@/components/site/site-contact-context";
import { SOCIAL_BRAND_COLORS, SOCIAL_LABELS, SocialIcon } from "@/components/blocks/_primitives/social-icons";

/**
 * Social Links: the site's social profiles from Business Profile > Social
 * Media (one list for the whole site). Nothing to show: nothing rendered on
 * the live site, a hint in the builder.
 */
export function SocialLinksBlock({ block, editor }: { block: SocialLinksBlockProps; editor?: boolean }) {
  const { socials = [] } = useSiteContact();
  const d = block.data;
  const align = d.align ?? "center";
  if (!socials.length) {
    return editor ? <p className="text-center text-sm text-muted-foreground py-4">Add your profiles in Business Profile → Social Media to show them here.</p> : null;
  }
  const box = { sm: "w-9 h-9", md: "w-11 h-11", lg: "w-14 h-14" }[d.size ?? "md"];
  const glyph = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" }[d.size ?? "md"];
  return (
    <div className={cn("max-w-5xl mx-auto px-4", align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left")}>
      {d.title && <h2 className="text-2xl font-bold mb-5" style={{ fontFamily: "var(--heading-font, inherit)" }}>{d.title}</h2>}
      <div className={cn("flex flex-wrap gap-3", align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start")}>
        {socials.map((s, i) => (
          <a key={`${s.platform}-${i}`} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}
            className={cn("inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5", d.showLabels ? "rounded-full border px-4 py-2 text-sm font-semibold" : cn("justify-center rounded-full", box))}
            style={d.brandColors !== false
              ? (d.showLabels ? { color: SOCIAL_BRAND_COLORS[s.platform], borderColor: `${SOCIAL_BRAND_COLORS[s.platform]}55` } : { background: SOCIAL_BRAND_COLORS[s.platform], color: "#fff" })
              : (d.showLabels ? undefined : { background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" })}>
            <SocialIcon platform={s.platform} className={glyph} />
            {d.showLabels && <span>{SOCIAL_LABELS[s.platform] ?? s.platform}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}
