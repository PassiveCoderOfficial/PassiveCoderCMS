"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PauseCircle, CreditCard, LifeBuoy, MessageCircle } from "lucide-react";

/** Pages a paused site's owner can still use: pay, and get help. */
const ALLOWED = ["/dashboard/subscription", "/dashboard/support"];
const WHATSAPP = "8801678669699";

/**
 * Dashboard lock for a site whose subscription has ended (tenants.status =
 * 'suspended'). Nothing is deleted and the plan is kept: the dashboard stays
 * visible but blurred and inert behind a card offering the only three things
 * that matter — renew, open a ticket, or message us. The subscription and
 * support pages themselves stay fully usable, with a banner.
 *
 * Decided on the client from the real pathname: the layout has no reliable
 * request path (middleware doesn't forward one).
 */
export function SuspendedGate({ suspended, siteName, children }: {
  suspended: boolean;
  siteName?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (!suspended) return <>{children}</>;

  const allowed = ALLOWED.some((p) => pathname.startsWith(p));
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, my site${siteName ? ` "${siteName}"` : ""} is paused. I'd like to renew.`)}`;

  if (allowed) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="bg-amber-500 text-amber-950 text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <PauseCircle className="w-4 h-4" />
          <span className="font-medium">Your site is paused because the subscription has ended.</span>
          <span>Renew to bring it back online instantly — all your content is safe.</span>
        </div>
        <div className="flex flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden blur-[6px] pointer-events-none select-none" aria-hidden inert>
        {children}
      </div>
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="suspended-title" className="w-full max-w-md rounded-2xl border bg-card text-card-foreground shadow-2xl p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <PauseCircle className="w-7 h-7" />
          </div>
          <h2 id="suspended-title" className="text-xl font-bold">Your site is paused</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {siteName ? <><span className="font-medium text-foreground">{siteName}</span>&apos;s</> : "Your"} subscription has ended, so the site is offline for visitors.
            Nothing has been deleted — renew and everything comes back instantly, exactly as it was.
          </p>
          <div className="grid gap-2.5 mt-6">
            <Link href="/dashboard/subscription" className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90">
              <CreditCard className="w-4 h-4" /> Renew subscription
            </Link>
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/dashboard/support" className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted">
                <LifeBuoy className="w-4 h-4" /> Open a ticket
              </Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90">
                <MessageCircle className="w-4 h-4" /> WhatsApp us
              </a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-5">Paying by bKash or bank? Message us and we&apos;ll restore it for you.</p>
        </div>
      </div>
    </div>
  );
}
