/**
 * Open edition: the paid modules are not part of this build, so they can
 * never be switched on (no menu links, no page builder blocks).
 */
const PAID_MODULES = new Set([
  "jobs", "pos", "accounting", "visa_tour", "blood_donation", "marketplace",
  "content_scheduler", "real_estate", "results", "restaurant", "projects",
]);

export function moduleInstalled(key: string): boolean {
  return !PAID_MODULES.has(key);
}

/** Hosted-only blocks (Passive Coder's own price list) are not in this build. */
const HOSTED_BLOCKS = new Set(["pricing_catalog"]);

export function blockInstalled(type: string): boolean {
  return !HOSTED_BLOCKS.has(type);
}
