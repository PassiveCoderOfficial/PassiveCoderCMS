import { z } from "zod";

/**
 * The site's social media profiles, stored once per site
 * (tenant_business_profiles.social_links, migration 165) and read by the
 * header top bar, the footer and the Social Links block.
 */
export const SOCIAL_NETWORKS = ["facebook", "instagram", "tiktok", "youtube", "linkedin", "twitter", "whatsapp", "snapchat"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export type SiteSocialLink = { platform: SocialNetwork; url: string; show?: boolean };

export const socialLinksSchema = z.array(z.object({
  platform: z.enum(SOCIAL_NETWORKS),
  url: z.string().trim().max(500).refine((u) => u === "" || /^https?:\/\//i.test(u), "Links must start with https://"),
  show: z.boolean().optional(),
})).max(20);

/** The links to show on the site: shown, with an address, in saved order. */
export function visibleSocials(list: unknown): { platform: SocialNetwork; url: string }[] {
  const parsed = socialLinksSchema.safeParse(list);
  if (!parsed.success) return [];
  return parsed.data.filter((s) => s.show !== false && s.url).map(({ platform, url }) => ({ platform, url }));
}

/** True when an error means migration 165 has not been applied yet. */
export const missingSocialColumn = (e: { message?: string; code?: string } | null | undefined) =>
  !!e && (e.code === "42703" || e.code === "PGRST204" || /social_links/.test(e.message ?? ""));
