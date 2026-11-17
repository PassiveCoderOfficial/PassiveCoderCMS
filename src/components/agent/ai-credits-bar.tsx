"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";
import type { CreditGroup, CreditStatus } from "@/lib/ai/credit-costs";
import { AiCreditsBuy } from "./ai-credits-buy";

const n = (v: number) => v.toLocaleString("en");
const GROUPS: { key: CreditGroup; label: "aiCredits.section" | "aiCredits.chat" | "aiCredits.assistant" | "aiCredits.other" }[] = [
  { key: "section", label: "aiCredits.section" },
  { key: "chat", label: "aiCredits.chat" },
  { key: "assistant", label: "aiCredits.assistant" },
  { key: "other", label: "aiCredits.other" },
];

/**
 * The one AI Credits meter, shown wherever AI runs: "AI Credits: X of Y left
 * this month", what they went on, and how to buy more. `compact` is the line
 * and bar only.
 */
export function AiCreditsBar({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useT();
  const [q, setQ] = useState<CreditStatus | null>(null);
  useEffect(() => {
    const load = () => fetch("/api/aicoder/quota").then((r) => (r.ok ? r.json() : null)).then(setQ).catch(() => null);
    load();
    // Refresh after AI actions elsewhere on the page.
    window.addEventListener("pc-ai-used", load);
    return () => window.removeEventListener("pc-ai-used", load);
  }, []);
  if (!q) return null;
  if (q.unlimited) return <p className={cn("text-xs text-muted-foreground flex items-center gap-1", className)}><Sparkles className="w-3 h-3" /> {t("aiCredits.unlimited")}</p>;
  const pct = q.total > 0 ? Math.min(100, Math.round(((q.total - q.left) / q.total) * 100)) : 100;
  const spent = GROUPS.filter((g) => g.key !== "other" || q.breakdown.other > 0);
  return (
    <div className={cn("space-y-1", className)}>
      <div className={cn("flex items-center gap-1 text-xs font-medium", q.left === 0 && "text-destructive")}>
        <Sparkles className="w-3 h-3 shrink-0" /> {t("aiCredits.line", { left: n(q.left), total: n(q.total) })}
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full", pct > 85 ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} /></div>
      {!compact && (
        <>
          <p className="text-[11px] text-muted-foreground">
            {spent.map((g) => `${t(g.label)} ${n(q.breakdown[g.key])}`).join(" · ")}
            {q.monthlyIncluded > 0 && ` · ${t("aiCredits.refill", { date: new Date(q.resetAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) })}`}
          </p>
          <AiCreditsBuy defaultOpen={q.left === 0} />
        </>
      )}
    </div>
  );
}
