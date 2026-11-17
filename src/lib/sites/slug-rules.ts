/** Subdomain rules shared by onboarding's availability check and Super Admin site creation (MCP). */
export const RESERVED_SLUGS = new Set([
  "www","app","api","admin","mail","docs","cdn","dashboard","support",
  "blog","status","help","dev","staging","test","demo","beta","assets",
  "static","media","img","images","files","uploads","smtp","ns1","ns2",
  "cms","cloud","portal","account","billing","auth","login","register",
  // Platform hubs on their own subdomains.
  "experts","restaurant","food","rider","riders",
]);

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

/** Why a subdomain can't be used, or null when it is valid (availability is checked separately). */
export function slugProblem(slug: string): string | null {
  if (!slug || slug.length < 3) return "Must be at least 3 characters";
  if (!SLUG_RE.test(slug)) return "Only lowercase letters, numbers, and hyphens";
  if (RESERVED_SLUGS.has(slug)) return "This name is reserved";
  return null;
}
