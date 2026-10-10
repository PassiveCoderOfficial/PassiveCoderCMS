"use client";

import React, { useEffect, useState } from "react";
import { Search, Loader2, Printer, ShieldCheck, SearchX, Check } from "lucide-react";
import type { ResultsSearchBlockProps } from "@/types/cms";
import type { LookupMode, PublicResult, ResultField } from "@/lib/results/fields";
import { ResultCard } from "./result-card";

interface Found { result: PublicResult; order: ResultField[]; labels: Record<ResultField, string>; verifyUrl: string }

/**
 * Result search: certificate number (+ DOB or roll when the site's lookup
 * mode asks for it) → result card with print and verify link. Three layouts:
 * card (centred), banner (full-width band, inline form), split (copy + image).
 */
export function ResultsSearchBlock({ block }: { block: ResultsSearchBlockProps }) {
  const { data } = block;
  const layout = data.layout ?? "card";
  const accent = data.accentColor || "hsl(var(--primary))";
  const [mode, setMode] = useState<LookupMode>("certificate");
  const [labels, setLabels] = useState<Partial<Record<ResultField, string>>>({});
  const [f, setF] = useState({ cert: "", dob: "", roll: "" });
  const [state, setState] = useState<"idle" | "loading" | "found" | "none" | "error">("idle");
  const [error, setError] = useState("");
  const [found, setFound] = useState<Found | null>(null);

  useEffect(() => {
    fetch("/api/results/lookup?meta=1").then((r) => r.json()).then((d) => {
      if (d.lookupMode) setMode(d.lookupMode);
      if (d.labels) setLabels(d.labels);
    }).catch(() => {}).finally(() => {
      // Deep link: ?cert=123 pre-fills the certificate number.
      const c = new URLSearchParams(window.location.search).get("cert");
      if (c) setF((x) => ({ ...x, cert: c }));
    });
  }, []);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!f.cert.trim()) return;
    setState("loading"); setError("");
    const qs = new URLSearchParams({ cert: f.cert.trim() });
    if (mode === "certificate_dob") qs.set("dob", f.dob);
    if (mode === "certificate_roll") qs.set("roll", f.roll);
    try {
      const res = await fetch(`/api/results/lookup?${qs}`);
      const d = await res.json();
      if (!res.ok) { setState("error"); setError(d.error ?? "Search failed. Please try again."); return; }
      if (!d.found) { setState("none"); setFound(null); return; }
      setFound(d); setState("found");
      setTimeout(() => document.getElementById(`res-${block.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch { setState("error"); setError("Search failed. Please try again."); }
  };

  const certLabel = labels.certificate_no || "Certificate Number";
  const input = "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
  const fields = (
    <>
      <input aria-label={certLabel} className={input} placeholder={data.placeholder || `Enter ${certLabel}`} value={f.cert} onChange={(e) => setF({ ...f, cert: e.target.value })} />
      {mode === "certificate_dob" && <input aria-label={labels.dob || "Date of Birth"} className={input} placeholder={`${labels.dob || "Date of Birth"} (DD-MM-YYYY)`} value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} />}
      {mode === "certificate_roll" && <input aria-label={labels.roll || "Roll No"} className={input} placeholder={labels.roll || "Roll No"} value={f.roll} onChange={(e) => setF({ ...f, roll: e.target.value })} />}
      <button type="submit" disabled={state === "loading"} className="h-12 shrink-0 rounded-xl px-6 font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: accent }}>
        {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {data.buttonLabel || "Search Result"}
      </button>
    </>
  );
  const notes = (data.notes ?? []).filter(Boolean);
  const noteList = notes.length > 0 && (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm opacity-80">
      {notes.map((n) => <li key={n} className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" style={{ color: accent }} />{n}</li>)}
    </ul>
  );
  const heading = (light: boolean) => (
    <>
      {data.eyebrow && <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${light ? "text-white/75" : ""}`} style={light ? undefined : { color: accent }}>{data.eyebrow}</p>}
      {data.title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">{data.title}</h2>}
      {data.subtitle && <p className={`mt-3 text-base md:text-lg ${light ? "text-white/80" : "text-muted-foreground"}`}>{data.subtitle}</p>}
    </>
  );

  const outcome = (
    <div id={`res-${block.id}`} className="scroll-mt-24">
      {state === "none" && (
        <div className="mt-8 max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 text-center text-card-foreground">
          <SearchX className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="mt-2 font-semibold">No result found</p>
          <p className="text-sm text-muted-foreground mt-1">Check the {certLabel.toLowerCase()}{mode !== "certificate" ? " and the details you entered" : ""} and try again.</p>
        </div>
      )}
      {state === "error" && <p className="mt-6 text-center text-sm text-red-500">{error}</p>}
      {state === "found" && found && (
        <div className="mt-8 max-w-4xl mx-auto text-left result-print">
          <ResultCard result={found.result} labels={found.labels} order={found.order} verified verifyUrl={found.verifyUrl} accentColor={data.accentColor} />
          <div className="mt-4 flex flex-wrap justify-center gap-3 print:hidden">
            {data.showPrint !== false && (
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"><Printer className="w-4 h-4" />Print result card</button>
            )}
            <a href={found.verifyUrl} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"><ShieldCheck className="w-4 h-4" />Verification page &amp; QR</a>
          </div>
          {/* Print only the result card, not the whole page. */}
          <style>{`@media print{body *{visibility:hidden!important}.result-print,.result-print *{visibility:visible!important}.result-print{position:absolute;left:0;top:0;width:100%;margin:0!important}}`}</style>
        </div>
      )}
    </div>
  );

  if (layout === "banner") {
    return (
      <section className="relative isolate overflow-hidden text-white" style={{ background: accent }}>
        {data.backgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.backgroundImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25" />
          </>
        )}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-20 text-center">
          {heading(true)}
          <form onSubmit={search} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto rounded-2xl bg-white/10 p-2 backdrop-blur [&_input]:border-white/20">{fields}</form>
          {noteList && <div className="flex justify-center [&_svg]:!text-white">{noteList}</div>}
        </div>
        <div className="px-4 sm:px-6 pb-10 text-foreground">{outcome}</div>
      </section>
    );
  }

  if (layout === "split") {
    return (
      <section className="px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            {heading(false)}
            <form onSubmit={search} className="mt-7 flex flex-col gap-3 max-w-lg">{fields}</form>
            {noteList}
          </div>
          {data.sideImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.sideImage} alt="" className="w-full aspect-[4/3] object-cover rounded-3xl" />
          ) : <div className="hidden lg:block aspect-[4/3] rounded-3xl bg-muted" />}
        </div>
        {outcome}
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        {heading(false)}
        <form onSubmit={search} className="mt-8 flex flex-col sm:flex-row gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">{fields}</form>
        {noteList && <div className="flex justify-center">{noteList}</div>}
      </div>
      {outcome}
    </section>
  );
}
