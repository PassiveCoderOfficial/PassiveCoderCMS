/**
 * Public template catalog — the published rows of the `templates` table.
 *
 * Previously served a hardcoded 55-entry list ("the source of truth"), of
 * which only 6 slugs resolved to a real template, and exposed a POST that
 * upserted all 55 of those fabricated entries straight into the templates
 * table. Both are gone: templates exist in one place now.
 */
import { NextResponse } from "next/server";
import { fetchPublishedTemplates } from "@/lib/templates/published-templates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const featured = searchParams.get("featured");

  let results = await fetchPublishedTemplates();

  if (category && category !== "All") {
    results = results.filter((t) => t.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }
  if (featured === "true") {
    results = results.filter((t) => t.featured);
  }

  return NextResponse.json(results);
}
