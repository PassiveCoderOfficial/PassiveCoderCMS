"use client";

import React, { useRef, useState } from "react";
import { trackMeta } from "@/components/site/meta-pixel";
import type { ContactFormField, InlineLeadFormData } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, Paperclip, Send } from "lucide-react";

/**
 * Shared form state + submit for every visitor-facing enquiry form (Contact
 * block, hero / slider inline form). Submits to /api/contact/submit, which
 * stores the message in the Contact inbox, emails the owner and feeds the CRM.
 */
/** Hidden from people; bots filling every input give themselves away. Renders inside the <form>. */
export function LeadFormTrap() {
  // Name and attributes chosen so browser and password-manager autofill skip
  // it: an autofilled trap used to silently drop real enquiries.
  return <input type="text" name="pc_hp_ref" tabIndex={-1} autoComplete="one-time-code" data-lpignore="true" data-1p-ignore="" data-bwignore="" data-form-type="other" aria-hidden="true" defaultValue="" style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", clipPath: "inset(50%)", pointerEvents: "none" }} />;
}

/** wa.me link carrying the visitor's answers, one "Label: value" line each. */
export function leadWhatsAppUrl(number: string, fields: ContactFormField[], values: Record<string, string>, intro?: string): string | null {
  const n = number.replace(/[^\d]/g, "");
  if (!n) return null;
  const lines = fields
    .filter((f) => (values[f.id] ?? "").trim())
    .map((f) => `${f.label}: ${f.type === "file" ? values[f.id].split(" — ")[0] : values[f.id].trim()}`);
  const text = [intro?.trim() || "Hello, I just sent an enquiry from your website.", "", ...lines].join("\n");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function useLeadForm(fields: ContactFormField[], opts: { recipientEmail?: string; formName: string; whatsappAfter?: { number: string; intro?: string } | null }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) if (f.defaultValue) init[f.id] = f.defaultValue;
    return init;
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  const set = (fieldId: string, value: string) => setValues((v) => ({ ...v, [fieldId]: value }));

  async function upload(fieldId: string, file: File | undefined) {
    if (!file) return;
    setUploading(fieldId); setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/contact/upload", { method: "POST", body: fd }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setUploading(null);
    if (!res?.ok) { setError(d.error ?? "Upload failed. Please try again."); return; }
    setValues((v) => ({ ...v, [fieldId]: `${d.name} — ${d.url}` }));
  }

  const toggle = (fieldId: string, option: string) => setValues((v) => {
    const cur = (v[fieldId] ?? "").split(", ").filter(Boolean);
    const next = cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option];
    return { ...v, [fieldId]: next.join(", ") };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = fields.find((f) => f.required && (f.type === "checkboxes" || f.type === "file") && !values[f.id]);
    if (missing) { setError(`Please complete "${missing.label}".`); return; }
    if (uploading) return;
    const trap = new FormData(e.currentTarget as HTMLFormElement).get("pc_hp_ref");
    setLoading(true);
    // WhatsApp after submit: open it now, inside the click (browsers block
    // pop-ups opened after an await). The save below runs with keepalive,
    // so it completes even if the phone hands over to the WhatsApp app.
    const wa = opts.whatsappAfter ? leadWhatsAppUrl(opts.whatsappAfter.number, fields, values, opts.whatsappAfter.intro) : null;
    let waWindow: Window | null = null;
    if (wa) {
      try { waWindow = window.open(wa, "_blank"); if (waWindow) waWindow.opener = null; } catch { waWindow = null; }
    }
    setWhatsappUrl(wa);
    // Key by field label so the CRM can recognize email/phone/name fields
    const labeled: Record<string, string> = {};
    for (const f of fields) {
      if (values[f.id] !== undefined) labeled[f.label] = values[f.id];
    }
    let saved = false;
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: labeled, recipient: opts.recipientEmail, formName: opts.formName, website: trap || undefined, elapsedMs: Date.now() - startedAt.current }),
        keepalive: true,
      });
      saved = res.ok;
    } catch {
      saved = false;
    }
    setLoading(false);
    if (!saved) {
      // Only say "thank you" once the server has the message.
      setError(wa
        ? "Sorry, your message could not be saved. Please send it on WhatsApp or try again."
        : "Sorry, your message could not be sent. Please check your connection and try again.");
      return;
    }
    trackMeta("Lead", { content_name: opts.formName ?? "Contact form" });
    setSubmitted(true);
    // Pop-up blocked: go to WhatsApp in this tab once the enquiry is saved.
    if (wa && !waWindow) window.location.href = wa;
  }

  return { values, setValues, set, submitted, setSubmitted, loading, uploading, error, upload, toggle, handleSubmit, whatsappUrl };
}

/** Starter field set when an owner switches the hero form on. */
export function defaultInlineLeadForm(newId: () => string): InlineLeadFormData {
  return {
    enabled: true,
    title: "Get a free quote",
    subtitle: "We reply within minutes on WhatsApp.",
    submitLabel: "Send enquiry",
    successMessage: "Thank you! We'll contact you shortly.",
    fields: [
      { id: newId(), label: "Name", type: "text", required: true },
      { id: newId(), label: "Phone / WhatsApp", type: "tel", required: true },
      { id: newId(), label: "Service", type: "select", required: true, options: ["Service one", "Service two", "Other"] },
      { id: newId(), label: "Message", type: "textarea", required: false },
    ],
  };
}

/**
 * Compact enquiry card for heroes: placeholders instead of labels, short
 * inputs paired two-up from small screens, full-width submit.
 */
export function InlineLeadForm({ form, className }: { form: InlineLeadFormData; className?: string }) {
  const fields = form.fields ?? [];
  const f = useLeadForm(fields, { recipientEmail: form.recipientEmail, formName: form.title?.trim() || "Hero enquiry" });
  const input = "w-full min-w-0 rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";
  const wide = (t: ContactFormField["type"]) => t === "textarea" || t === "checkboxes" || t === "file" || t === "select";
  const ph = (fl: ContactFormField) => `${fl.label}${fl.required ? " *" : ""}`;

  return (
    <div data-pc-lead-form="" className={cn("w-full min-w-0 rounded-2xl border bg-card text-card-foreground shadow-xl p-5 sm:p-6", className)}>
      {f.submitted ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="font-semibold">{form.successMessage || "Thank you! We'll be in touch soon."}</p>
        </div>
      ) : (
        <>
          {form.title && <p className="text-lg font-bold leading-snug">{form.title}</p>}
          {form.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{form.subtitle}</p>}
          <form onSubmit={f.handleSubmit} className={cn("grid gap-3 sm:grid-cols-2 [&>*]:min-w-0", (form.title || form.subtitle) && "mt-4")}>
            {fields.map((fl) => (
              <div key={fl.id} className={cn(wide(fl.type) && "sm:col-span-2")}>
                {fl.type === "textarea" ? (
                  <textarea required={fl.required} rows={2} placeholder={ph(fl)} aria-label={fl.label}
                    value={f.values[fl.id] ?? ""} onChange={(e) => f.set(fl.id, e.target.value)} className={cn(input, "resize-y")} />
                ) : fl.type === "select" ? (
                  <select required={fl.required} aria-label={fl.label} value={f.values[fl.id] ?? ""}
                    onChange={(e) => f.set(fl.id, e.target.value)} className={cn(input, !f.values[fl.id] && "text-muted-foreground")}>
                    <option value="">{ph(fl)}</option>
                    {fl.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : fl.type === "checkboxes" ? (
                  <div className="grid gap-1.5 sm:grid-cols-2" role="group" aria-label={fl.label}>
                    <span className="sm:col-span-2 text-sm text-muted-foreground">{ph(fl)}</span>
                    {(fl.options ?? []).map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-[hsl(var(--primary))]" checked={(f.values[fl.id] ?? "").split(", ").includes(o)} onChange={() => f.toggle(fl.id, o)} />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : fl.type === "file" ? (
                  <label className={cn(input, "flex items-center gap-2 cursor-pointer text-muted-foreground")}>
                    {f.uploading === fl.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    <span className="min-w-0 flex-1 truncate">{f.values[fl.id] ? f.values[fl.id].split(" — ")[0] : ph(fl)}</span>
                    <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt" onChange={(e) => f.upload(fl.id, e.target.files?.[0])} />
                  </label>
                ) : (
                  <input type={fl.type} required={fl.required} placeholder={ph(fl)} aria-label={fl.label}
                    autoComplete={fl.type === "tel" ? "tel" : fl.type === "email" ? "email" : fl.label.toLowerCase() === "name" ? "name" : undefined}
                    value={f.values[fl.id] ?? ""} onChange={(e) => f.set(fl.id, e.target.value)} className={input} />
                )}
              </div>
            ))}
            {f.error && <p className="sm:col-span-2 text-sm text-red-500">{f.error}</p>}
            <button type="submit" disabled={f.loading || !!f.uploading}
              className="sm:col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-primary transition-opacity hover:opacity-90 disabled:opacity-50">
              <Send className="w-4 h-4" />
              {f.loading ? "Sending…" : form.submitLabel || "Send enquiry"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
