/**
 * Pure slug helper — deliberately separate from `permissions.ts`, which pulls
 * in the server-only Supabase client. Client components need slugify without
 * dragging server code into the browser bundle.
 */
export function slugifyTemplateName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
