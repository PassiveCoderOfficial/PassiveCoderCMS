"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Data = {
  score: number;
  checks: { key: string; ok: boolean; label: string; fix: string; href?: string }[];
  automatic: { label: string; url: string | null }[];
};

/** Readiness for Google AI Overviews, ChatGPT, Claude, Copilot and Perplexity. */
export function AiVisibilityCard() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    fetch("/api/seo/ai-visibility").then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);
  if (!data) return null;
  const todo = data.checks.filter((c) => !c.ok);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> AI search visibility</span>
          <span className={`text-sm rounded-full px-2.5 py-0.5 ${data.score >= 80 ? "bg-green-500/15 text-green-700 dark:text-green-400" : data.score >= 50 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-red-500/15 text-red-700 dark:text-red-400"}`}>
            {data.score}%
          </span>
        </CardTitle>
        <CardDescription>
          How ready your site is to be found and quoted by Google AI Overviews, ChatGPT, Claude, Copilot and Perplexity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {data.checks.map((c) => (
            <li key={c.key} className="flex items-start gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" /> : <Circle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />}
              <div className="min-w-0">
                <p className={c.ok ? "" : "font-medium"}>{c.label}</p>
                {!c.ok && (
                  <p className="text-xs text-muted-foreground">
                    {c.fix} {c.href && <Link href={c.href} className="underline">Fix it</Link>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {todo.length === 0 && <p className="text-sm text-green-700 dark:text-green-400">Everything in your control is done.</p>}
        <div className="border-t pt-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Done for you automatically</p>
          {data.automatic.map((a) => (
            <p key={a.label} className="text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> {a.label}
              {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="w-3 h-3" /></a>}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
