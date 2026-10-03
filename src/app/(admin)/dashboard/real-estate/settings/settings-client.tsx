"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";

const inputCls = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

type S = Record<string, unknown>;

export function SettingsClient({ initial }: { initial: S }) {
  const [s, setS] = useState<S>({ default_currency: "SAR", default_area_unit: "sqm", brochure_gate: true, ...initial });
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setS((p) => ({ ...p, [k]: v }));
  const text = (k: string, label: string, ph?: string) => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input className={`${inputCls} mt-1`} placeholder={ph} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value)} />
    </label>
  );

  const save = async () => {
    setState("saving");
    setError("");
    const res = await fetch("/api/real-estate/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    if (!res.ok) { setError((await res.json()).error ?? "Save failed"); setState("idle"); return; }
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agent Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Shown on every property page: the agent card, WhatsApp and call buttons, and the licence line.</p>
      </div>
      <section className="bg-card border border-border rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
        {text("agent_name", "Agent name")}
        {text("agent_title", "Title", "Founder & Property Advisor")}
        {text("whatsapp", "WhatsApp number", "+971 56 409 0700")}
        {text("phone", "Call number")}
        {text("email", "Lead notification email")}
        {text("licence_text", "Licence line", "REGA FAL No. … · RERA BRN …")}
        <label className="block">
          <span className="text-xs text-muted-foreground">Default currency</span>
          <select className={`${inputCls} mt-1`} value={String(s.default_currency)} onChange={(e) => set("default_currency", e.target.value)}>
            {["SAR", "AED", "USD"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Default area unit</span>
          <select className={`${inputCls} mt-1`} value={String(s.default_area_unit)} onChange={(e) => set("default_area_unit", e.target.value)}>
            <option value="sqm">sqm</option><option value="sqft">sqft</option>
          </select>
        </label>
        <label className="sm:col-span-2 flex items-center gap-3">
          <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={!!s.brochure_gate} onChange={(e) => set("brochure_gate", e.target.checked)} />
          <span className="text-sm text-foreground">Ask for WhatsApp number before brochure download</span>
        </label>
        <div className="sm:col-span-2">
          <span className="text-xs text-muted-foreground">Agent photo</span>
          <div className="mt-1"><MediaPickerInput value={String(s.agent_photo ?? "")} onChange={(v) => set("agent_photo", v)} /></div>
        </div>
      </section>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={state === "saving"} className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
          {state === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
          {state === "saved" ? <><CheckCircle2 className="w-4 h-4" />Saved</> : "Save settings"}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
