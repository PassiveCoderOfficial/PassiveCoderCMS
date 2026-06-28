"use client";

import React, { useState } from "react";
import type { EligibilityCheckerBlockProps } from "@/types/cms";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const AGE_BANDS = ["18–24", "25–34", "35–44", "45–55", "55+"];
const EDU = ["Below SSC", "SSC / HSC", "Diploma / Trade", "Bachelor", "Master or above"];
const EXP = ["No experience", "1–3 years", "3–5 years", "5+ years"];
const ENGLISH = ["None", "Basic", "IELTS / PTE band 5–6", "IELTS / PTE 6.5+"];

export function EligibilityCheckerBlock({ block }: { block: EligibilityCheckerBlockProps }) {
  const { title, subtitle, destinations, submitLabel, successMessage, recipientEmail, accentColor } = block.data;
  const accent = accentColor ?? "#1e3a8a";
  const dests = destinations && destinations.length > 0
    ? destinations
    : [
        { id: "eu", label: "Europe (Work Permit)", value: "Europe" },
        { id: "gcc", label: "GCC / Middle East", value: "GCC" },
        { id: "skilled", label: "Skilled Migration (AU/CA/NZ)", value: "Skilled Migration" },
        { id: "study", label: "Student Visa", value: "Student" },
      ];

  const [step, setStep] = useState<Step>(0);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => { setAns((p) => ({ ...p, [k]: v })); setStep((s) => (s + 1) as Step); };
  const reset = () => { setStep(0); setAns({}); setName(""); setPhone(""); setDone(false); };

  // crude scoring → likely eligible if mid-young age + some edu/exp
  const score = () => {
    let s = 0;
    if (["18–24", "25–34", "35–44"].includes(ans.age)) s += 2; else if (ans.age === "45–55") s += 1;
    if (["Diploma / Trade", "Bachelor", "Master or above"].includes(ans.edu)) s += 2; else if (ans.edu === "SSC / HSC") s += 1;
    if (["3–5 years", "5+ years"].includes(ans.exp)) s += 2; else if (ans.exp === "1–3 years") s += 1;
    if (["IELTS / PTE band 5–6", "IELTS / PTE 6.5+"].includes(ans.english)) s += 1;
    return s;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const verdict = score() >= 4 ? "Likely Eligible" : "Needs Consultation";
    try {
      await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            "Form": "Eligibility Checker",
            "Name": name, "Phone/WhatsApp": phone,
            "Destination": ans.destination, "Age": ans.age, "Education": ans.edu,
            "Experience": ans.exp, "English": ans.english, "Result": verdict,
          },
          recipient: recipientEmail,
        }),
      });
    } catch { /* non-blocking */ }
    setLoading(false);
    setDone(true);
  }

  const eligible = score() >= 4;

  const card = "bg-white rounded-2xl border border-black/5 shadow-lg p-6 sm:p-8";
  const optBtn = "w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-current font-medium text-gray-700 transition-colors";

  const Options = ({ label, opts, k }: { label: string; opts: string[]; k: string }) => (
    <div>
      <p className="text-sm font-semibold text-gray-500 mb-3">{label}</p>
      <div className="grid gap-2">
        {opts.map((o) => (
          <button key={o} type="button" onClick={() => set(k, o)} className={optBtn} style={{ color: accent }}>
            <span className="text-gray-800">{o}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-lg text-gray-500 mt-3">{subtitle}</p>}
        </div>
      )}

      <div className={card}>
        {/* progress */}
        {!done && (
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= step ? accent : "#e5e7eb" }} />
            ))}
          </div>
        )}

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">{eligible ? "✅" : "📋"}</div>
            <h3 className="text-2xl font-bold" style={{ color: accent }}>
              {eligible ? "Great news — you look eligible!" : "Let's review your profile"}
            </h3>
            <p className="text-gray-600 mt-3">
              {successMessage ?? "Thank you! Our visa experts will contact you within 24 hours with your personalized options."}
            </p>
            <button onClick={reset} className="mt-6 text-sm font-semibold underline" style={{ color: accent }}>Check again</button>
          </div>
        ) : step === 0 ? (
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-3">Where do you want to go?</p>
            <div className="grid gap-2">
              {dests.map((d) => (
                <button key={d.id} type="button" onClick={() => set("destination", d.value)} className={optBtn} style={{ color: accent }}>
                  <span className="text-gray-800">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : step === 1 ? (
          <Options label="Your age group" opts={AGE_BANDS} k="age" />
        ) : step === 2 ? (
          <Options label="Highest education" opts={EDU} k="edu" />
        ) : step === 3 ? (
          <Options label="Work experience" opts={EXP} k="exp" />
        ) : step === 4 ? (
          <Options label="English proficiency" opts={ENGLISH} k="english" />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm font-semibold text-gray-500">Almost done — where should we send your result?</p>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-current" style={{ color: accent }} />
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-current" style={{ color: accent }} />
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: accent }}>
              {loading ? "Checking…" : (submitLabel ?? "Check My Eligibility")}
            </button>
          </form>
        )}

        {!done && step > 0 && (
          <button onClick={() => setStep((s) => (s - 1) as Step)} className="mt-5 text-sm text-gray-400 hover:text-gray-600">← Back</button>
        )}
      </div>
    </div>
  );
}
