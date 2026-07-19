import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("pages")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (due ?? []).map((p) => p.id);
  if (ids.length === 0) return NextResponse.json({ published: 0 });

  await supabase
    .from("pages")
    .update({ status: "published", published_at: now })
    .in("id", ids);

  console.log(`[publish-scheduled] Published ${ids.length} pages`);

  return NextResponse.json({ published: ids.length });
}
