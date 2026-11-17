"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, X } from "lucide-react";

const DISMISS_KEY = "pc_ai_site_banner_dismissed";

interface Job {
  status: string;
  total_pages: number;
  pages_done: number;
  current_page: string | null;
  error: string | null;
}

/**
 * Tells the owner their site was written by AiCoder.
 *
 * The signup build publishes automatically, so without this the customer opens
 * a dashboard full of copy they did not write and has no idea where it came
 * from or that they may edit it. Saying so plainly is the whole point — the
 * pages are a starting draft, live, and theirs to change.
 *
 * Keeps polling while a build is still running, since the owner often reaches
 * the dashboard before the last page is written.
 */
export function AiSiteBanner({ tenantId }: { tenantId: string | null }) {
  const [job, setJob] = useState<Job | null>(null);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until storage is read

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false); // storage blocked — showing it once is better than never
    }
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function poll() {
      try {
        const res = await fetch(`/api/onboarding/build-site?tenantId=${tenantId}`);
        const data = await res.json();
        if (stopped) return;
        setJob(data.job ?? null);
        // Keep watching only while there is something to watch.
        if (data.job && ["pending", "planning", "building"].includes(data.job.status)) {
          timer = setTimeout(poll, 4000);
        }
      } catch {
        // Transient — stop quietly rather than hammering.
      }
    }
    poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [tenantId]);

  if (!job) return null;

  const running = ["pending", "planning", "building"].includes(job.status);
  if (job.status === "done" && dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* nothing to do */ }
  }

  if (job.status === "failed") {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
        <AlertCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">We couldn&apos;t write your pages automatically</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your site is live with its template, and nothing was charged. You can
            write the pages yourself, or open any page and use AiCoder.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={dismiss} className="shrink-0 h-7 w-7 p-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
      {running
        ? <Loader2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5 animate-spin" />
        : <Sparkles className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        {running ? (
          <>
            <p className="font-semibold text-sm">Writing your website…</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.current_page ? `Working on "${job.current_page}"` : "Planning your pages"}
              {job.total_pages > 0 && ` — ${job.pages_done} of ${job.total_pages} done`}.
              You can carry on; this finishes on its own.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-sm">Your site was written by AiCoder</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We wrote {job.pages_done} {job.pages_done === 1 ? "page" : "pages"} from what
              you told us at signup, and they are live. Read them over — everything is
              yours to edit, and anything we got wrong is worth fixing before you
              share the link.
            </p>
          </>
        )}
      </div>
      {!running && (
        <div className="flex items-center gap-1 shrink-0">
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/pages">Review pages</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={dismiss} className="h-7 w-7 p-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
