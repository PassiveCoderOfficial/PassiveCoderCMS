import React from "react";
import { BadgeCheck } from "lucide-react";
import type { PublicResult, ResultField } from "@/lib/results/fields";

/**
 * One result card, shared by the results_search block, the /verify page and
 * its print view, so a design fix lands everywhere. Pure markup (no hooks) so
 * it renders on the server too. `print` tightens it for A4 paper.
 */
export function ResultCard({
  result, labels, order, verified, qrSvg, verifyUrl, institute, signatory, accentColor, print,
}: {
  result: PublicResult;
  labels: Partial<Record<ResultField, string>>;
  order: ResultField[];
  verified?: boolean;
  qrSvg?: string | null;
  verifyUrl?: string | null;
  institute?: string | null;
  signatory?: { name?: string | null; title?: string | null; signature?: string | null } | null;
  accentColor?: string;
  print?: boolean;
}) {
  const accent = accentColor || "hsl(var(--primary))";
  const rows = order.filter((f) => result[f] && f !== "student_name" && f !== "photo_url");
  return (
    <article className={`result-card bg-card text-card-foreground border border-border rounded-2xl overflow-hidden ${print ? "shadow-none" : "shadow-xl"}`}>
      <div className="px-6 py-4 flex items-center justify-between gap-4 text-white" style={{ background: accent }}>
        <div className="min-w-0">
          {institute && <p className="text-xs uppercase tracking-[0.18em] opacity-85 truncate">{institute}</p>}
          <p className="text-lg font-semibold">{labels.certificate_no ? "Result Verification" : "Result"}</p>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold whitespace-nowrap">
            <BadgeCheck className="w-4 h-4" /> Verified record
          </span>
        )}
      </div>

      <div className="p-6 grid gap-6 sm:grid-cols-[160px_1fr]">
        <div className="flex sm:flex-col items-center gap-4">
          {result.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.photo_url} alt={result.student_name ?? ""} className="w-32 h-40 sm:w-40 sm:h-48 object-cover rounded-xl border border-border bg-muted" />
          ) : (
            <div className="w-32 h-40 sm:w-40 sm:h-48 rounded-xl border border-dashed border-border bg-muted" />
          )}
          {qrSvg && (
            <div className="w-28 sm:w-32 text-center">
              <div className="bg-white p-1.5 rounded-lg border border-border [&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="text-[10px] text-muted-foreground mt-1">Scan to verify</p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-2xl font-bold tracking-tight">{result.student_name}</h3>
          {result.course_name && (
            <p className="mt-1 text-sm text-muted-foreground">
              {result.course_url ? <a href={result.course_url} className="hover:underline" style={{ color: accent }}>{result.course_name}</a> : result.course_name}
            </p>
          )}
          <dl className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {rows.map((f) => (
              <div key={f} className={`border-b border-border/70 pb-2 ${f === "notes" ? "sm:col-span-2" : ""}`}>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{labels[f] ?? f}</dt>
                <dd className={`mt-0.5 text-sm font-medium break-words ${f === "result" ? "text-base font-bold" : ""}`} style={f === "result" ? { color: accent } : undefined}>{result[f]}</dd>
              </div>
            ))}
          </dl>

          {(signatory?.name || signatory?.signature) && (
            <div className="mt-6 flex justify-end">
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {signatory.signature && <img src={signatory.signature} alt="" className="h-12 mx-auto object-contain" />}
                <div className="border-t border-border mt-1 pt-1 px-6">
                  {signatory.name && <p className="text-sm font-semibold">{signatory.name}</p>}
                  {signatory.title && <p className="text-xs text-muted-foreground">{signatory.title}</p>}
                </div>
              </div>
            </div>
          )}
          {verifyUrl && !print && <p className="mt-4 text-xs text-muted-foreground break-all">Verification link: <a href={verifyUrl} className="underline">{verifyUrl}</a></p>}
        </div>
      </div>
    </article>
  );
}
