import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** GET /api/results/alumni-public[?limit=n] — students the admin ticked for
 *  the alumni showcase. Only display fields leave the server. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit")) || 24, 100);
  const admin = await createAdminClient();
  const { data } = await admin.from("results")
    .select("id, student_name, photo_url, course_name, alumni_position, alumni_location, alumni_quote, course:results_courses(name)")
    .eq("tenant_id", tenantId).eq("status", "published").eq("alumni_featured", true)
    .order("updated_at", { ascending: false }).limit(limit);
  return NextResponse.json((data ?? []).map((r) => ({
    id: r.id, name: r.student_name, photo: r.photo_url,
    course: (r.course as { name?: string } | null)?.name ?? r.course_name,
    position: r.alumni_position, location: r.alumni_location, quote: r.alumni_quote,
  })));
}
