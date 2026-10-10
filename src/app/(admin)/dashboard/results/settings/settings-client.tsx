"use client";

import React, { useRef, useState } from "react";
import { Loader2, Upload, Download, Check } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { parseCsv } from "@/lib/import/parse";
import { RESULT_FIELDS, DEFAULT_LABELS, DEFAULT_PUBLIC, type ResultsSettings, type ResultField } from "@/lib/results/fields";

const inputCls = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const card = "bg-card border border-border rounded-2xl p-5 space-y-4";

export function ResultsSettingsClient({ initial, total }: { initial: ResultsSettings; total: number }) {
  const [s, setS] = useState<ResultsSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    setSaving(true); setMsg(""); setSaved(false);
    const res = await fetch("/api/results/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); } else setMsg((await res.json()).error ?? "Save failed");
  };

  const runImport = async (file: File) => {
    setImporting(true); setImportMsg([]);
    const rows = parseCsv(await file.text());
    let inserted = 0, updated = 0; const skipped: string[] = [];
    for (let i = 0; i < rows.length; i += 500) {
      const res = await fetch("/api/results/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: rows.slice(i, i + 500) }) });
      const d = await res.json();
      if (!res.ok) { skipped.push(d.error ?? "Import failed"); break; }
      inserted += d.inserted; updated += d.updated; skipped.push(...(d.skipped ?? []));
    }
    setImporting(false);
    setImportMsg([`${inserted} added, ${updated} updated from ${rows.length} rows.`, ...skipped.slice(0, 20), ...(skipped.length > 20 ? [`…and ${skipped.length - 20} more skipped`] : [])]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pub = (f: ResultField) => s.public_fields[f] ?? DEFAULT_PUBLIC[f];

  return (
    <div className="p-6 max-w-4xl space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Results Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{total} results stored. How students find them, what the public sees, and bulk import.</p>
      </div>

      <section className={card}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Result lookup</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {([
            ["certificate", "Certificate number only", "Anyone with the number sees the result."],
            ["certificate_dob", "Certificate + date of birth", "Both must match. Safer."],
            ["certificate_roll", "Certificate + roll number", "Both must match."],
          ] as const).map(([v, t, h]) => (
            <button key={v} type="button" onClick={() => setS({ ...s, lookup_mode: v })}
              className={`text-left rounded-xl border p-4 ${s.lookup_mode === v ? "border-indigo-500 bg-indigo-500/10" : "border-border hover:bg-muted"}`}>
              <p className="text-sm font-medium text-foreground">{t}</p>
              <p className="text-xs text-muted-foreground mt-1">{h}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">The QR verification page (/verify/&lt;certificate&gt;) always shows only name, course, result, dates and photo.</p>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Public result card</h2>
        <label className="flex items-center gap-3 text-sm text-foreground">
          <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={s.mask_passport} onChange={(e) => setS({ ...s, mask_passport: e.target.checked })} />
          Mask passport numbers (show only the last 4 digits)
        </label>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {RESULT_FIELDS.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={pub(f)} disabled={f === "student_name" || f === "certificate_no"}
                onChange={(e) => setS({ ...s, public_fields: { ...s.public_fields, [f]: e.target.checked } })} title="Show on public result card" />
              <input className={`${inputCls} py-1.5`} value={s.labels[f] ?? ""} placeholder={DEFAULT_LABELS[f]}
                onChange={(e) => setS({ ...s, labels: { ...s.labels, [f]: e.target.value } })} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Tick = shown publicly. Rename any label to match your certificates.</p>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Institute &amp; signature (verify page and print)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">Institute name</span><input className={`${inputCls} mt-1`} value={s.institute_name ?? ""} onChange={(e) => setS({ ...s, institute_name: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted-foreground">Signatory name</span><input className={`${inputCls} mt-1`} value={s.signatory_name ?? ""} onChange={(e) => setS({ ...s, signatory_name: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted-foreground">Signatory title</span><input className={`${inputCls} mt-1`} value={s.signatory_title ?? ""} onChange={(e) => setS({ ...s, signatory_title: e.target.value })} /></label>
          <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">Signature image (transparent PNG)</span><div className="mt-1"><MediaPickerInput value={s.signature_url ?? ""} onChange={(v) => setS({ ...s, signature_url: v })} /></div></label>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Import &amp; export</h2>
        <p className="text-sm text-muted-foreground">CSV columns: certificate_no, roll, student_name, father_name, mother_name, result, course_name, dob, gender, passport_no, issue_date, duration, notes, photo_url, status. Existing certificate numbers are updated; new ones are added. Export first to get the template.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { window.location.href = "/api/results/export"; }} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted flex items-center gap-2 text-foreground"><Download className="w-4 h-4" />Export CSV</button>
          <button type="button" disabled={importing} onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted flex items-center gap-2 text-foreground disabled:opacity-60">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && runImport(e.target.files[0])} />
        </div>
        {importMsg.length > 0 && <ul className="text-xs text-muted-foreground space-y-0.5">{importMsg.map((m, i) => <li key={i}>{m}</li>)}</ul>}
      </section>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background border-t border-border px-6 py-3 flex items-center justify-end gap-3 z-30">
        <span className="text-sm text-red-400 mr-auto">{msg}</span>
        <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}{saved ? "Saved" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
