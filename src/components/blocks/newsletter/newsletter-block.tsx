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
      <div className={cn("max-w-xl mx-auto text-center", data.layout === "card" && "bg-card border rounded-2xl p-10 shadow-sm")}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-lg">{data.successMessage || "You're subscribed!"}</p>
      </div>
    );
  }

  if (data.fieldStyle === "underline") {
    // Shop-style: small upper-case title, underlined field with a light pill button inside it.
    return (
      <div className="max-w-[600px] mx-auto text-center">
        {data.title && <h2 className="uppercase text-[16px] font-normal m-0 mb-6">{data.title}</h2>}
        {data.description && <p className="text-sm opacity-80 -mt-2 mb-6">{data.description}</p>}
        <form onSubmit={handleSubmit} className="flex items-center border-b border-current/40 pb-2.5" style={{ borderColor: "rgba(0,0,0,.35)" }}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={data.placeholder || "Email address"}
            aria-label="Email address" className="flex-1 min-w-0 bg-transparent text-[15px] outline-none placeholder:text-current placeholder:opacity-70" />
          <button type="submit" disabled={loading} className="rounded-full bg-[#EFEFEF] text-[#202020] px-11 py-3 text-[15px] hover:opacity-90 disabled:opacity-50">
            {loading ? "…" : data.submitLabel || "Sign up"}
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn(
      "max-w-xl mx-auto",
      data.layout === "card" && "bg-card border rounded-2xl p-10 shadow-sm",
      data.layout === "stacked" ? "text-center" : "",
    )}>
      {data.title && <h2 className={cn("text-2xl font-bold mb-2", data.layout !== "inline" && "text-center")}>{data.title}</h2>}
      {data.description && <p className={cn("text-muted-foreground mb-6", data.layout !== "inline" && "text-center")}>{data.description}</p>}
      <form onSubmit={handleSubmit} className={cn(
        // Row from sm up; on phones field and button stack so the button
        // can't push the page wider than the screen.
        "flex flex-col gap-2",
        data.layout !== "stacked" && "sm:flex-row",
      )}>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={data.placeholder || "Enter your email…"}
          className="flex-1 min-w-0 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
