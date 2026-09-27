"use client";

import { useEffect } from "react";

/**
 * Last-resort fallback for a public page that fails as a whole (database
 * unreachable, broken layout data). Individual block crashes never reach
 * this — page-renderer.tsx isolates those per block. Deliberately
 * unbranded: this renders on client sites, so it must never show the
 * platform's name or logo, just a calm retry.
 */
export default function PublicPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public-page] render failed:", error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-24">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">This page is temporarily unavailable</h1>
        <p className="text-muted-foreground">Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
