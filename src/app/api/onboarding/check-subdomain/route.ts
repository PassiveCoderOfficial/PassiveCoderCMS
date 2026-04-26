import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const RESERVED = new Set([
  "www","app","api","admin","mail","docs","cdn","dashboard","support",
  "blog","status","help","dev","staging","test","demo","beta","assets",
  "static","media","img","images","files","uploads","smtp","ns1","ns2",
  "cms","cloud","portal","account","billing","auth","login","register",
]);

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("slug") ?? "";
  const slug = raw.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  if (!slug || slug.length < 3)
    return NextResponse.json({ available: false, slug, reason: "Must be at least 3 characters" });

  if (!SLUG_RE.test(slug))
    return NextResponse.json({ available: false, slug, reason: "Only lowercase letters, numbers, and hyphens" });

  if (RESERVED.has(slug))
    return NextResponse.json({ available: false, slug, reason: "This name is reserved" });

  const supabase = await createAdminClient();
  const { data } = await supabase.from("tenants").select("id").eq("slug", slug).single();

  return NextResponse.json({ available: !data, slug });
}
