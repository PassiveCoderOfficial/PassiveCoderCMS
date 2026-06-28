"use client";

import React, { useState } from "react";
import type { StatusTrackerBlockProps } from "@/types/cms";

type StatusResult = {
  found: boolean;
  reference?: string;
  applicant?: string;
  stage?: string;
  steps?: { label: string; done: boolean }[];
  message?: string;
};

export function StatusTrackerBlock({ block }: { block: StatusTrackerBlockProps }) {
  const { title, subtitle, placeholder, helpText, submitLabel, accentColor } = block.data;
  const accent = accentColor ?? "#1e3a8a";
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/visa-status?ref=${encodeURIComponent(ref.trim())}`);
      const data = (await res.json()) as StatusResult;
      setResult(data);
    } catch {
      setResult({ found: false, message: "Could not check status right now. Please try again or contact us." });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-lg text-gray-500 mt-3">{subtitle}</p>}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 shadow-lg p-6 sm:p-8">
        <form onSubmit={check} className="flex flex-col sm:flex-row gap-3">
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder={placeholder ?? "Enter passport or reference number"}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-current"
            style={{ color: accent }}
          />
          <button type="submit" disabled={loading}
            className="px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-60 whitespace-nowrap"
            style={{ background: accent }}>
            {loading ? "Checking…" : (submitLabel ?? "Track Status")}
          </button>
        </form>
        {helpText && <p className="text-xs text-gray-400 mt-3">{helpText}</p>}

        {result && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            {result.found ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Reference</p>
                    <p className="font-semibold text-gray-800">{result.reference}</p>
                  </div>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full text-white" style={{ background: accent }}>{result.stage}</span>
                </div>
                {result.steps && (
                  <ol className="space-y-3">
                    {result.steps.map((s, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: s.done ? accent : "#cbd5e1" }}>
                          {s.done ? "✓" : i + 1}
                        </span>
                        <span className={s.done ? "text-gray-800 font-medium" : "text-gray-400"}>{s.label}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="text-4xl mb-3">🔎</div>
                <p className="text-gray-600">
                  {result.message ?? "No application found for that reference. Please double-check, or contact our team on WhatsApp for help."}
                </p>
                <a href="https://wa.me/8801711145428" target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-4 text-sm font-semibold underline" style={{ color: accent }}>
                  Contact us on WhatsApp →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
