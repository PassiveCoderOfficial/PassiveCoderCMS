import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { canWriteSite } from "@/lib/auth/site-write";
import { normCert } from "@/lib/results/fields";

/** Header aliases (CSV headers are pre-normalised to snake_case by parseCsv). */
const ALIAS: Record<string, string> = {
  certificate_no: "certificate_no", certificate_number: "certificate_no", certificate: "certificate_no", cert_no: "certificate_no", registration_id: "certificate_no", reg_no: "certificate_no",
  roll: "roll", roll_no: "roll", roll_number: "roll",
  student_name: "student_name", name: "student_name", student: "student_name",
  father_name: "father_name", fathers_name: "father_name", father_s_name: "father_name", father: "father_name",
  mother_name: "mother_name", mothers_name: "mother_name", mother_s_name: "mother_name", mother: "mother_name",
  result: "result", grade: "result", cgpa: "result", gpa: "result",
  course: "course_name", course_name: "course_name", subject: "course_name", program: "course_name",
  photo: "photo_url", photo_url: "photo_url", image: "photo_url",
  dob: "dob", date_of_birth: "dob", d_o_b: "dob", birth_date: "dob",
  gender: "gender", sex: "gender",
  passport: "passport_no", passport_no: "passport_no", passport_number: "passport_no",
  issue_date: "issue_date", issued: "issue_date", date_of_issue: "issue_date",
  duration: "duration", session: "duration",
  notes: "notes", note: "notes", remarks: "notes", extra: "notes",
  status: "status",
};

/**
 * POST /api/results/import  { rows: Record<string,string>[] }
 * Upserts results by certificate number (existing certificates are updated,
 * new ones inserted). The browser parses the CSV and sends rows in chunks.
 * Course names that match a course in the courses list get linked.
 */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });

  const { rows } = (await req.json().catch(() => ({}))) as { rows?: Record<string, string>[] };
  if (!Array.isArray(rows) || !rows.length) return NextResponse.json({ error: "No rows" }, { status: 400 });
  if (rows.length > 1000) return NextResponse.json({ error: "Send at most 1000 rows per request" }, { status: 400 });

  const supabase = await createClient();
  const [{ data: existing }, { data: courses }] = await Promise.all([
    supabase.from("results").select("id, certificate_no").eq("tenant_id", tenantId).limit(100000),
    supabase.from("results_courses").select("id, name").eq("tenant_id", tenantId),
  ]);
  const byCert = new Map((existing ?? []).map((r) => [normCert(r.certificate_no), r.id as string]));
  const courseByName = new Map((courses ?? []).map((c) => [c.name.trim().toLowerCase(), c.id as string]));

  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; row: Record<string, unknown> }[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  rows.forEach((raw, i) => {
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      const f = ALIAS[k];
      if (f && v != null && String(v).trim() !== "") row[f] = String(v).trim();
    }
    const cert = String(row.certificate_no ?? "");
    if (!cert || !row.student_name) { skipped.push(`Row ${i + 2}: missing certificate number or student name`); return; }
    const key = normCert(cert);
    if (seen.has(key)) { skipped.push(`Row ${i + 2}: duplicate certificate ${cert} in file`); return; }
    seen.add(key);
    if (row.status !== "draft") row.status = "published";
    const cid = row.course_name ? courseByName.get(String(row.course_name).toLowerCase()) : undefined;
    if (cid) row.course_id = cid;
    const id = byCert.get(key);
    if (id) updates.push({ id, row: { ...row, updated_at: new Date().toISOString() } });
    else inserts.push({ ...row, tenant_id: tenantId });
  });

  for (let i = 0; i < inserts.length; i += 200) {
    const { error } = await supabase.from("results").insert(inserts.slice(i, i + 200));
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  for (const u of updates) {
    const { error } = await supabase.from("results").update(u.row).eq("id", u.id).eq("tenant_id", tenantId);
    if (error) skipped.push(`${u.row.certificate_no}: ${error.message}`);
  }
  return NextResponse.json({ inserted: inserts.length, updated: updates.length, skipped });
}
