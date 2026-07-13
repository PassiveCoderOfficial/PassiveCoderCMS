"use client";

import React, { useState } from "react";
import type { NewsletterBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export function NewsletterBlock({ block }: { block: NewsletterBlockProps }) {
  const { data } = block;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      // Always feed the site's own CRM list; optional external webhook after
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { setError("Subscription failed. Please try again."); setLoading(false); return; }
      if (data.webhookUrl) {
        await fetch(data.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).catch(() => null);
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={cn("max-w-xl mx-auto text-center", data.layout === "card" && "bg-white border rounded-2xl p-10 shadow-sm")}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-lg">{data.successMessage || "You're subscribed!"}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "max-w-xl mx-auto",
      data.layout === "card" && "bg-white border rounded-2xl p-10 shadow-sm",
      data.layout === "stacked" ? "text-center" : "",
    )}>
      {data.title && <h2 className={cn("text-2xl font-bold mb-2", data.layout !== "inline" && "text-center")}>{data.title}</h2>}
      {data.description && <p className={cn("text-muted-foreground mb-6", data.layout !== "inline" && "text-center")}>{data.description}</p>}
      <form onSubmit={handleSubmit} className={cn(
        "flex gap-2",
        data.layout === "stacked" && "flex-col",
      )}>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={data.placeholder || "Enter your email…"}
          className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors whitespace-nowrap disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? "…" : data.submitLabel || "Subscribe"}
        </button>
      </form>
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-500 mt-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}
