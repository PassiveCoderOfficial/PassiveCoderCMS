import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

const COLS = ["certificate_no", "roll", "student_name", "father_name", "mother_name", "result", "course_name", "dob", "gender", "passport_no", "issue_date", "duration", "notes", "photo_url", "status"] as const;

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET /api/results/export — every result as CSV, in the same columns the
 *  importer reads, so export → edit in Excel → import round-trips. */
export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("results").select("*, course:results_courses(name)")
    .eq("tenant_id", tenantId).order("certificate_no").limit(100000);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const lines = [COLS.join(",")];
  for (const r of data ?? []) {
    const row = { ...r, course_name: r.course?.name ?? r.course_name };
    lines.push(COLS.map((c) => cell((row as Record<string, unknown>)[c])).join(","));
  }
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="results-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
