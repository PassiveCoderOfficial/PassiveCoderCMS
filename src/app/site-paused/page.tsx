import type { Metadata } from "next";

/**
 * What visitors see on a paused site (subscription ended / unpaid). Served by
 * the proxy with HTTP 503 + Retry-After so search engines treat it as a
 * temporary outage and keep the site indexed.
 *
 * Deliberately neutral: visitors are the business's customers, and telling
 * them the owner didn't pay does the business harm. The owner gets the full
 * reason (and renew options) in their dashboard.
 */
export const metadata: Metadata = { title: "Temporarily unavailable" };

export default async function SitePausedPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const { name } = await searchParams;
  const site = name?.slice(0, 80);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-6">
          <span className="block w-4 h-4 border-l-4 border-r-4 border-slate-500" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold">
          {site ? <>{site} is temporarily unavailable</> : "This website is temporarily unavailable"}
        </h1>
        <p className="mt-3 text-slate-600">
          We&apos;re not able to show this site right now. Please check back soon.
        </p>
        <a href="/login" className="inline-block mt-10 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-4">
          Site owner? Sign in
        </a>
      </div>
    </div>
  );
}
