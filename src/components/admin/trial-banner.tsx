"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

/**
 * Free-trial countdown across the dashboard: days left, or (after the trial)
 * that the site is paused and when it will be deleted. Links to Subscription.
 */
type State = { kind: "none" } | { kind: "trial"; daysLeft: number } | { kind: "paused"; deleteAfter: string; daysToDelete: number };

export function TrialBanner() {
  const { language } = useLanguage();
  const bn = language === "bn";
  const [s, setS] = useState<State | null>(null);
  useEffect(() => { fetch("/api/tenant/trial").then((r) => r.json()).then(setS).catch(() => setS(null)); }, []);
  if (!s || s.kind === "none") return null;

  if (s.kind === "trial") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-50 px-4 py-2 text-sm text-amber-900 border-b border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900">
        <Clock className="h-4 w-4 shrink-0" />
        <span>{bn ? `ফ্রি ট্রায়াল: আর ${s.daysLeft} দিন বাকি। পেমেন্ট করলে সাইট লাইভ হবে, কিছুই হারাবে না।` : `Free trial: ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} left. Pay to go live; nothing you built is lost.`}</span>
        <Link href="/dashboard/subscription" className="rounded-full bg-amber-600 px-3 py-0.5 text-xs font-semibold text-white hover:bg-amber-700">{bn ? "পেমেন্ট করুন" : "Pay now"}</Link>
      </div>
    );
  }
  const date = new Date(s.deleteAfter).toLocaleDateString(bn ? "bn-BD" : undefined, { day: "numeric", month: "long" });
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-red-50 px-4 py-2 text-sm text-red-900 border-b border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{bn ? `ট্রায়াল শেষ, সাইট বন্ধ আছে। ${date} তারিখে মুছে যাবে, যদি না পেমেন্ট করেন।` : `Your trial has ended and the site is paused. It will be deleted on ${date} unless you pay.`}</span>
      <Link href="/dashboard/subscription" className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-semibold text-white hover:bg-red-700">{bn ? "এখনই পেমেন্ট করুন" : "Pay now"}</Link>
    </div>
  );
}
