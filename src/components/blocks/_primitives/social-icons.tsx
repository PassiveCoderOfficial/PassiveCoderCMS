import React from "react";
import type { FooterSocial } from "@/types/cms";
import { cn } from "@/lib/utils";

/**
 * Social network glyphs (lucide dropped brand marks) and their brand
 * colours. Shared by the footer and the header top bar.
 */
export const SOCIAL_PLATFORMS = ["facebook", "instagram", "tiktok", "youtube", "linkedin", "twitter", "whatsapp", "snapchat", "github"] as const;

export const SOCIAL_BRAND_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#111111",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  twitter: "#111111",
  whatsapp: "#25D366",
  snapchat: "#F7C600",
  github: "#181717",
};

export const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  linkedin: "LinkedIn", twitter: "X (Twitter)", whatsapp: "WhatsApp", snapchat: "Snapchat", github: "GitHub",
};

export function SocialIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
  switch (platform) {
    case "facebook": return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
    case "instagram": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
    case "twitter": return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
    case "linkedin": return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
    case "youtube": return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff"/></svg>;
    case "tiktok": return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>;
    case "snapchat": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.8c2.9 0 4.9 2.2 4.9 5v2.4l1.6-.5c.6 0 .9.6.4 1-.6.5-1.9.8-1.9 1.4.4 1.8 2 3.4 3.7 3.8.4.1.4.6 0 .8-.7.3-1.7.4-2.1.6-.3.4-.1 1.1-.7 1.1-.6 0-1.4-.3-2.4.1-1 .4-1.7 1.7-3.5 1.7s-2.5-1.3-3.5-1.7c-1-.4-1.8-.1-2.4-.1-.6 0-.4-.7-.7-1.1-.4-.2-1.4-.3-2.1-.6-.4-.2-.4-.7 0-.8 1.7-.4 3.3-2 3.7-3.8 0-.6-1.3-.9-1.9-1.4-.5-.4-.2-1 .4-1l1.6.5V7.8c0-2.8 2-5 4.9-5z"/></svg>;
    case "whatsapp": return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>;
    case "github": return <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>;
    default: return <span className="text-xs font-bold">{platform.charAt(0).toUpperCase()}</span>;
  }
}

/**
 * A row of social links. `brand`: each icon in its network's colour on a
 * white round chip (readable on dark and light bars alike); otherwise the
 * icon inherits the text colour.
 */
/** Official app-icon backgrounds (Instagram uses its gradient). */
export const SOCIAL_APP_BG: Record<string, string> = {
  ...SOCIAL_BRAND_COLORS,
  instagram: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
  tiktok: "#000000",
  twitter: "#000000",
};

export function SocialLinks({ socials, brand, app, size = "sm", className, chipClassName, chipStyle }: {
  socials: FooterSocial[]; brand?: boolean; size?: "xs" | "sm"; className?: string;
  chipClassName?: string; chipStyle?: React.CSSProperties;
  /** Official app-icon look: rounded square in the network's colour, white glyph. */
  app?: boolean;
}) {
  const list = socials.filter((s) => s.url);
  if (!list.length) return null;
  const chip = size === "xs" ? "w-6 h-6" : "w-9 h-9";
  const icon = size === "xs" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className={cn("flex items-center flex-wrap", size === "xs" ? "gap-1.5" : "gap-2", className)}>
      {list.map((s, i) => (
        <a key={`${s.platform}-${i}`} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}
          className={cn("inline-flex items-center justify-center shrink-0 transition-transform hover:-translate-y-0.5", app ? "rounded-[28%]" : "rounded-full", chip, chipClassName)}
          style={app ? { background: SOCIAL_APP_BG[s.platform] ?? "#111", color: "#fff" } : brand ? { background: "#fff", color: SOCIAL_BRAND_COLORS[s.platform] ?? "#111" } : chipStyle}>
          {app && s.platform === "youtube"
            ? <svg className={icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000"/></svg>
            : <SocialIcon platform={s.platform} className={icon} />}
        </a>
      ))}
    </div>
  );
}
