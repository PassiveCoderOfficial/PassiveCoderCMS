import { NextResponse } from "next/server";
import { runOnboardingBuildTick, type BuildTickResult } from "@/lib/aicoder/onboarding-build";

export const maxDuration = 300;

/**
 * Builds the next page of any waiting signup site.
 *
 * Several pages per invocation where time allows, one job at a time. The whole
 * point of the redesign is that no single invocation has to finish a site: a
 * page is roughly nine sequential model calls and fits comfortably, a site is
 * four times that and does not.
 *
 * Stops well before the platform's ceiling so the last page it starts can
 * actually complete — a page killed halfway is the failure this replaced.
 */
const BUDGET_MS = 210_000;

async function handle(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const ticks: BuildTickResult[] = [];

  // Each tick claims a job, builds one page and releases. Looping here rather
  // than once-per-cron means a site finishes in minutes instead of hours,
  // while the per-page boundary keeps any single failure cheap.
  while (Date.now() - startedAt < BUDGET_MS) {
    let result: BuildTickResult | null;
    try {
      result = await runOnboardingBuildTick();
    } catch (err) {
      // runOnboardingBuildTick handles its own failures; reaching here means
      // something outside a job broke, so stop rather than spin.
      console.error("[cron/onboarding-build]", err);
      break;
    }
    if (!result) break; // nothing waiting
    ticks.push(result);
  }

  const summary = {
    pagesAttempted: ticks.length,
    pagesBuilt: ticks.filter(t => t.built).length,
    jobsFinished: ticks.filter(t => t.finished).length,
    errors: ticks.filter(t => t.error).length,
  };
  if (ticks.length) console.log("[cron/onboarding-build]", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export const POST = handle;
