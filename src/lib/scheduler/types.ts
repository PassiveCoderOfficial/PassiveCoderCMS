/** Shared types + display metadata for the content scheduler. Single source of
 *  truth for platform/status/type labels so the calendar, list, board and
 *  editor sheet can never drift apart. */

export const PLATFORMS = [
  "facebook", "instagram", "linkedin", "x", "youtube",
  "tiktok", "threads", "pinterest", "gbp", "other",
] as const;
export type Platform = typeof PLATFORMS[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  threads: "Threads",
  pinterest: "Pinterest",
  gbp: "Google Business",
  other: "Other",
};

/** Short badge text — platform pills sit inline in dense list rows. */
export const PLATFORM_SHORT: Record<Platform, string> = {
  facebook: "FB", instagram: "IG", linkedin: "LI", x: "X", youtube: "YT",
  tiktok: "TT", threads: "TH", pinterest: "PIN", gbp: "GBP", other: "—",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: "#1877f2",
  instagram: "#e1306c",
  linkedin: "#0a66c2",
  x: "#0f172a",
  youtube: "#ff0000",
  tiktok: "#111827",
  threads: "#111827",
  pinterest: "#e60023",
  gbp: "#4285f4",
  other: "#64748b",
};

export const CONTENT_TYPES = [
  "short_video", "reel", "post", "carousel", "story",
  "article", "live", "thread", "newsletter", "other",
] as const;
export type ContentType = typeof CONTENT_TYPES[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  short_video: "Short Video",
  reel: "Reel",
  post: "Graphic Post",
  carousel: "Carousel",
  story: "Story",
  article: "Article",
  live: "Live",
  thread: "Thread",
  newsletter: "Newsletter",
  other: "Other",
};

export const STATUSES = [
  "idea", "drafting", "in_review", "approved",
  "scheduled", "published", "failed", "archived",
] as const;
export type ContentStatus = typeof STATUSES[number];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  idea: "Idea",
  drafting: "Drafting",
  in_review: "In Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  archived: "Archived",
};

/** Tailwind classes per status — badge styling shared by every view. */
export const STATUS_CLASSES: Record<ContentStatus, string> = {
  idea: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  drafting: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  in_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  approved: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  archived: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

export const PILLARS = [
  "educational", "trust", "behind_scenes", "case_study", "offer", "engagement",
] as const;
export type Pillar = typeof PILLARS[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  educational: "Educational",
  trust: "Trust Building",
  behind_scenes: "Behind the Scenes",
  case_study: "Case Study",
  offer: "Offer",
  engagement: "Engagement",
};

export const BRAND_KINDS = ["company", "personal", "product", "other"] as const;
export type BrandKind = typeof BRAND_KINDS[number];

export const ACCESS_LEVELS = ["viewer", "editor", "approver", "admin"] as const;
export type AccessLevel = typeof ACCESS_LEVELS[number];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  viewer: "Viewer — read only",
  editor: "Editor — create and edit content",
  approver: "Approver — edit and approve for publishing",
  admin: "Admin — full access, can manage who else has access",
};

/** The five top-level tabs. Each is a predicate over the same query, not a
 *  separate data layer — see getContentFeed(). */
export const BUCKETS = ["upcoming", "attention", "backlog", "published", "calendar"] as const;
export type Bucket = typeof BUCKETS[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  upcoming: "Upcoming",
  attention: "Needs Attention",
  backlog: "Backlog",
  published: "Published",
  calendar: "Calendar",
};

export type MediaAsset = { url: string; type?: string; alt?: string };

export type BrandProfile = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  kind: BrandKind;
  description: string | null;
  avatar_url: string | null;
  color: string;
  timezone: string;
  position: number;
  is_active: boolean;
};

export type BrandChannel = {
  id: string;
  brand_id: string;
  platform: Platform;
  handle: string | null;
  profile_url: string | null;
  is_active: boolean;
};

export type ContentTarget = {
  id: string;
  content_item_id: string;
  channel_id: string | null;
  platform: Platform;
  body_override: string | null;
  scheduled_at: string | null;
  status: "scheduled" | "published" | "failed" | "skipped";
  publish_mode: "manual" | "api";
  external_post_url: string | null;
  error_text: string | null;
  published_at: string | null;
};

export type ContentItem = {
  id: string;
  tenant_id: string;
  brand_id: string;
  title: string;
  hook: string | null;
  body: string | null;
  content_type: ContentType;
  pillar: Pillar | null;
  status: ContentStatus;
  scheduled_at: string | null;
  published_at: string | null;
  assignee_id: string | null;
  cta: string | null;
  tags: string[];
  media: MediaAsset[];
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  content_targets?: ContentTarget[];
  brand_profiles?: Pick<BrandProfile, "id" | "name" | "color" | "kind"> | null;
};

export type SchedulerFilters = {
  brandIds: string[];
  platforms: Platform[];
  statuses: ContentStatus[];
  types: ContentType[];
  mineOnly: boolean;
  q: string;
};

export const EMPTY_FILTERS: SchedulerFilters = {
  brandIds: [], platforms: [], statuses: [], types: [], mineOnly: false, q: "",
};
