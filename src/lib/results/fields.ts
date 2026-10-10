/**
 * Results module: one place for the result fields, their default labels, which
 * are public by default, and the public-view filter. The lookup API, verify
 * page, print card, dashboard and CSV import all read from here.
 */

export type LookupMode = "certificate" | "certificate_dob" | "certificate_roll";

export interface ResultRow {
  id: string;
  certificate_no: string;
  roll: string | null;
  student_name: string;
  father_name: string | null;
  mother_name: string | null;
  result: string | null;
  course_id: string | null;
  course_name: string | null;
  photo_url: string | null;
  dob: string | null;
  gender: string | null;
  passport_no: string | null;
  issue_date: string | null;
  duration: string | null;
  notes: string | null;
  status: "published" | "draft";
  course?: { name: string; slug: string; page_url: string | null } | null;
}

export interface ResultsSettings {
  lookup_mode: LookupMode;
  public_fields: Partial<Record<ResultField, boolean>>;
  mask_passport: boolean;
  institute_name: string | null;
  signatory_name: string | null;
  signatory_title: string | null;
  signature_url: string | null;
  labels: Partial<Record<ResultField, string>>;
}

export const RESULT_FIELDS = [
  "certificate_no", "roll", "student_name", "father_name", "mother_name", "result", "course_name",
  "dob", "gender", "passport_no", "issue_date", "duration", "notes", "photo_url",
] as const;
export type ResultField = typeof RESULT_FIELDS[number];

export const DEFAULT_LABELS: Record<ResultField, string> = {
  certificate_no: "Certificate Number",
  roll: "Roll No",
  student_name: "Student Name",
  father_name: "Father's Name",
  mother_name: "Mother's Name",
  result: "Result",
  course_name: "Course",
  dob: "Date of Birth",
  gender: "Gender",
  passport_no: "Passport Number",
  issue_date: "Issue Date",
  duration: "Duration",
  notes: "Notes",
  photo_url: "Photo",
};

/** Shown on the public result card unless the site switches them off. */
export const DEFAULT_PUBLIC: Record<ResultField, boolean> = {
  certificate_no: true, roll: true, student_name: true, father_name: true, mother_name: true, result: true,
  course_name: true, dob: true, gender: true, passport_no: true, issue_date: true, duration: true, notes: true, photo_url: true,
};

/** Fields always shown on the QR verify page (no extra proof asked), kept to
 *  what an employer needs to confirm a certificate is genuine. */
export const VERIFY_FIELDS: ResultField[] = ["certificate_no", "student_name", "course_name", "result", "issue_date", "duration", "photo_url"];

export const DEFAULT_SETTINGS: ResultsSettings = {
  lookup_mode: "certificate",
  public_fields: {},
  mask_passport: true,
  institute_name: null,
  signatory_name: null,
  signatory_title: null,
  signature_url: null,
  labels: {},
};

export function withDefaults(s: Partial<ResultsSettings> | null | undefined): ResultsSettings {
  return { ...DEFAULT_SETTINGS, ...(s ?? {}), public_fields: { ...(s?.public_fields ?? {}) }, labels: { ...(s?.labels ?? {}) } };
}

export function label(s: ResultsSettings, f: ResultField): string {
  return s.labels[f]?.trim() || DEFAULT_LABELS[f];
}

export function isPublic(s: ResultsSettings, f: ResultField): boolean {
  return s.public_fields[f] ?? DEFAULT_PUBLIC[f];
}

export function maskPassport(v: string): string {
  const t = v.trim();
  return t.length <= 4 ? "****" : `${"*".repeat(Math.min(t.length - 4, 6))}${t.slice(-4)}`;
}

/** Normalise a certificate number for matching: trim, collapse spaces, lowercase. */
export function normCert(v: string): string {
  return v.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Loose date compare for DOB checks: digits only, so 01/01/1998, 01-01-1998
 *  and 01.01.1998 all match. */
export function normDate(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

export type PublicResult = Partial<Record<ResultField, string>> & { course_url?: string | null };

/** Strip a row down to what the public may see. `mode: "verify"` shows only
 *  VERIFY_FIELDS; `mode: "full"` shows every field the site made public. */
export function publicView(row: ResultRow, s: ResultsSettings, mode: "full" | "verify" = "full"): PublicResult {
  const out: PublicResult = {};
  const fields = mode === "verify" ? VERIFY_FIELDS : RESULT_FIELDS;
  for (const f of fields) {
    if (mode === "full" && !isPublic(s, f)) continue;
    let v: string | null = f === "course_name" ? (row.course?.name ?? row.course_name) : (row[f] as string | null);
    if (v == null || String(v).trim() === "") continue;
    v = String(v).trim();
    if (f === "passport_no" && s.mask_passport) v = maskPassport(v);
    out[f] = v;
  }
  out.course_url = row.course?.page_url ?? null;
  return out;
}

/** Display order on the result card (photo and name are rendered separately). */
export const CARD_ORDER: ResultField[] = [
  "certificate_no", "roll", "course_name", "result", "issue_date", "duration",
  "father_name", "mother_name", "dob", "gender", "passport_no", "notes",
];
