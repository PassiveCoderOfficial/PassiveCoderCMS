import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@/lib/templates/templates-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const featured = searchParams.get("featured");

  // Filter in-memory from the static data (source of truth)
  let results = [...TEMPLATES];

  if (category && category !== "All") {
    results = results.filter(t => t.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }
  if (featured === "true") {
    results = results.filter(t => t.featured);
  }

  return NextResponse.json(results);
}

// Admin: sync templates data to DB
export async function POST(req: Request) {
  const supabase = await createAdminClient();
  const body = await req.json().catch(() => null);

  // Allow sync from super-admin only via a secret header
  const authHeader = req.headers.get("x-admin-secret");
  if (authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body?.action === "sync") {
    const rows = TEMPLATES.map((t, i) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: t.tags,
      gradient: t.gradient,
      thumb_from: t.thumbFrom,
      thumb_to: t.thumbTo,
      accent_color: t.accentColorHex,
      pages: t.pages,
      has_demo: t.hasDemo,
      featured: t.featured ?? false,
      badge: t.badge ?? null,
      hero_headline: t.heroHeadline,
      hero_subline: t.heroSubline,
      sort_order: i,
      active: true,
    }));

    const { error } = await supabase.from("templates").upsert(rows, { onConflict: "slug" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, synced: rows.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
