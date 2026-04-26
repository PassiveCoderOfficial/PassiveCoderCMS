import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const supabase = await createAdminClient();

  const { data: existing } = await supabase.from("homepage_settings").select("id").single();

  const payload = {
    hero_headline: body.hero_headline,
    hero_subheadline: body.hero_subheadline,
    hero_cta_text: body.hero_cta_text,
    hero_cta_url: body.hero_cta_url,
    hero_secondary_cta: body.hero_secondary_cta,
    stat_sites: body.stat_sites,
    stat_businesses: body.stat_businesses,
    stat_uptime: body.stat_uptime,
    announcement_enabled: body.announcement_enabled,
    announcement_text: body.announcement_text,
    announcement_url: body.announcement_url,
    meta_title: body.meta_title,
    meta_description: body.meta_description,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from("homepage_settings").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("homepage_settings").insert(payload);
  }

  return NextResponse.json({ ok: true });
}
