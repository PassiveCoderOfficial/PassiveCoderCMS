"use client";

import React, { useState } from "react";
import type { ContactBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";

export function ContactBlock({ block }: { block: ContactBlockProps }) {
  const { data } = block;
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (data.recipientEmail) {
        await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: values, recipient: data.recipientEmail }),
        });
      }
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  const form = (
    <div className={cn("flex-1", data.layout === "split" ? "" : "")}>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {data.fields.map(f => (
            <div key={f.id}>
              <label className="block text-sm font-medium mb-1">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
              {f.type === "textarea" ? (
                <textarea
                  required={f.required}
                  rows={4}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              ) : f.type === "select" ? (
                <select
                  required={f.required}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select…</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  required={f.required}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? "Sending…" : data.submitLabel || "Send Message"}
          </button>
        </form>
      )}
    </div>
  );

  const infoPanel = data.showContactInfo && (
    <div className="space-y-4">
      {data.title && data.layout === "split" && <h2 className="text-2xl font-bold mb-2">{data.title}</h2>}
      {data.subtitle && data.layout === "split" && <p className="text-muted-foreground mb-6">{data.subtitle}</p>}
      {data.email && (
        <a href={`mailto:${data.email}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          {data.email}
        </a>
      )}
      {data.phone && (
        <a href={`tel:${data.phone}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-primary" />
          </div>
          {data.phone}
        </a>
      )}
      {data.address && (
        <div className="flex items-start gap-3 text-sm">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <span className="text-muted-foreground">{data.address}</span>
        </div>
      )}
      {data.showMap && data.mapEmbedUrl && (
        <div className="mt-4 rounded-xl overflow-hidden aspect-video">
          <iframe src={data.mapEmbedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" />
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("max-w-5xl mx-auto", data.layout === "centered" && "max-w-2xl")}>
      {data.layout === "split" ? (
        <div className="grid md:grid-cols-2 gap-12">
          {infoPanel}
          {form}
        </div>
      ) : data.layout === "left" ? (
        <div className="grid md:grid-cols-2 gap-12">
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
