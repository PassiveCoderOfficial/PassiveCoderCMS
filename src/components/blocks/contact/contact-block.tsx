"use client";

import React, { useState } from "react";
import type { ContactBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, MessageCircle } from "lucide-react";

export function ContactBlock({ block }: { block: ContactBlockProps }) {
  const { data } = block;
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Key by field label so the CRM can recognize email/phone/name fields
      const labeled: Record<string, string> = {};
      for (const f of data.fields) {
        if (values[f.id] !== undefined) labeled[f.label] = values[f.id];
      }
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: labeled, recipient: data.recipientEmail, formName: data.title || "Contact" }),
      });
      if (!res.ok) { setLoading(false); return; }
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  // "filled": WooCommerce/Divi-style form — grey filled boxes, placeholders
  // instead of labels, no card frame, pill submit button on the right.
  const filled = data.formStyle === "filled";
  const inputCls = filled
    ? "w-full border-0 bg-muted rounded-none px-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    : "w-full border border-input bg-background rounded-lg px-3.5 py-2.5 text-sm transition-shadow focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";
  const form = (
    <div className={cn("flex-1", !filled && "rounded-2xl border bg-card text-card-foreground shadow-lg p-6 sm:p-8")}>
      {(data.title || data.subtitle) && data.layout !== "split" && (
        <div className={cn("mb-8", data.layout === "centered" ? "text-center" : "")}>
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="font-semibold text-lg">{data.successMessage || "Message sent!"}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cn("grid gap-4", filled && "sm:grid-cols-2")}>
          {data.fields.map(f => (
            <div key={f.id} className={cn(filled && (f.type === "textarea" ? "sm:col-span-2" : ""))}>
              {!filled && <label className="block text-sm font-medium mb-1">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>}
              {f.type === "textarea" ? (
                <textarea
                  required={f.required}
                  rows={filled ? 6 : 4}
                  placeholder={filled ? f.label : undefined}
                  aria-label={f.label}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className={cn(inputCls, "resize-y")}
                />
              ) : f.type === "select" ? (
                <select
                  required={f.required}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select…</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  required={f.required}
                  placeholder={filled ? f.label : undefined}
                  aria-label={f.label}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className={inputCls}
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full sm:w-auto justify-center flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50",
              filled ? "sm:col-span-2 sm:justify-self-end px-10 py-3.5 rounded-full uppercase tracking-wide hover:opacity-90" : "px-7 py-3 rounded-lg shadow-primary hover:-translate-y-0.5 transition-transform",
            )}
          >
            {!filled && <Send className="w-4 h-4" />}
            {loading ? "Sending…" : data.submitLabel || "Send Message"}
          </button>
        </form>
      )}
    </div>
  );

  const whatsappDigits = data.whatsapp?.replace(/[^\d]/g, "");
  const rows: { icon: React.ElementType; label: string; value: string; href?: string }[] = [
    ...(data.phone ? [{ icon: Phone, label: "Call us", value: data.phone, href: `tel:${data.phone.replace(/[^+\d]/g, "")}` }] : []),
    ...(data.email ? [{ icon: Mail, label: "Email us", value: data.email, href: `mailto:${data.email}` }] : []),
    ...(data.address ? [{ icon: MapPin, label: "Visit us", value: data.address }] : []),
    ...(data.hours ? [{ icon: Clock, label: "Opening hours", value: data.hours }] : []),
  ];
  const split = data.layout === "split";

  // Details panel. In the split layout it's a tinted brand panel carrying
  // the heading, so the section reads as designed even before any details
  // are filled in (the settings panel can pull them from the business profile).
  const infoPanel = data.showContactInfo && (
    <div className={cn(split && "rounded-2xl bg-primary/[0.06] border border-primary/10 p-6 sm:p-8 flex flex-col")}>
      {data.title && split && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
      {data.subtitle && split && <p className="text-muted-foreground mb-8">{data.subtitle}</p>}
      {rows.length > 0 && (
        <div className="grid gap-5">
          {rows.map(({ icon: Icon, label, value, href }) => {
            const inner = (
              <>
                <span className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
                  <span className="block font-medium break-words">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} className="flex items-center gap-4 hover:text-primary transition-colors">{inner}</a>
            ) : (
              <div key={label} className="flex items-center gap-4">{inner}</div>
            );
          })}
        </div>
      )}
      {whatsappDigits && (
        <a
          href={`https://wa.me/${whatsappDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
        </a>
      )}
      {data.note && <p className="mt-6 text-sm text-muted-foreground">{data.note}</p>}
      {data.showMap && data.mapEmbedUrl && (
        <div className="mt-6 rounded-xl overflow-hidden aspect-video border">
          <iframe src={data.mapEmbedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" />
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("max-w-5xl mx-auto px-4 sm:px-0", data.layout === "centered" && "max-w-2xl")}>
      {data.layout === "split" ? (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {infoPanel}
          {form}
        </div>
      ) : data.layout === "left" ? (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {form}
          {infoPanel}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {infoPanel && <div className="w-full mb-8">{infoPanel}</div>}
          {form}
        </div>
      )}
    </div>
  );
}
