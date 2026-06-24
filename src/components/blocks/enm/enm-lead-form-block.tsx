"use client";

import React, { useState } from "react";
import type { EnmLeadFormBlockProps } from "@/types/cms";
import { CheckCircle, Send } from "lucide-react";

export function EnmLeadFormBlock({ block }: { block: EnmLeadFormBlockProps }) {
  const { data } = block;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.apiKey) { setError("No API key configured."); return; }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { name, sourceUrl: window.location.href };
      if (email) body.email = email;
      if (data.showPhone && phone) body.phone = phone;
      if (data.showMessage && message) body.message = message;

      const res = await fetch("https://expertnear.me/api/leads/inbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 201 || res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json().catch(() => ({}));
        setError((json as { error?: string }).error ?? "Failed to send. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="max-w-xl mx-auto">
      {data.formTitle && (
        <h2 className="text-2xl font-bold mb-6">{data.formTitle}</h2>
      )}

      {submitted ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="font-semibold text-lg">{data.thankYouMessage || "Thanks! We'll be in touch soon."}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
              placeholder="your@email.com"
            />
          </div>

          {data.showPhone && (
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={inputCls}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          )}

          {data.showMessage && (
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="How can we help?"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? "Sending…" : (data.buttonLabel || "Send Message")}
          </button>
        </form>
      )}
    </div>
  );
}
