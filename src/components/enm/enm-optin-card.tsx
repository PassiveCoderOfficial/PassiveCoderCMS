"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

/**
 * Opt-in card for the ExpertNear.Me listing.
 *
 * ENM is deliberately NOT provisioned at signup: creating a directory profile
 * for everyone who buys a website produces listings nobody asked for and
 * inflates the expert count with people who will never use it. The owner opts
 * in here, which is also the moment we can explain what they are getting.
 *
 * `/api/enm/sso` provisions on demand and returns a short-lived SSO link, so
 * one button covers both "create my listing" and "open my listing".
 */
export function ENMOptInCard({
  tier,
  provisioned,
  profileComplete,
  className,
}: {
  /** ENM tier this tenant's plan entitles them to. */
  tier: "free" | "pro";
  /** True once an ENM account exists for this tenant. */
  provisioned: boolean;
  /** False until the business profile is filled in. Gates creation. */
  profileComplete: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  // Publishing an empty profile produces a listing that makes the business
  // look abandoned, which is worse than having none.
  const blocked = !provisioned && !profileComplete;

  async function open() {
    setLoading(true);
    try {
      const res = await fetch("/api/enm/sso");
      // The route redirects on success; a JSON body means it failed.
      if (res.redirected) { window.open(res.url, "_blank", "noopener"); return; }
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not open ExpertNear.Me. Please try again.");
    } catch {
      toast.error("Could not reach ExpertNear.Me. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              ExpertNear.Me {tier === "pro" ? "Pro" : "listing"}
              {tier === "pro" && (
                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold align-middle">
                  Included with your plan
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {provisioned
                ? "Your verified profile in our expert directory. Customers can find you there and contact you directly."
                : "Get a verified profile in our expert directory — a second place customers can find you, with a badge you can put on this site and share on WhatsApp."}
              {tier === "pro" && !provisioned && " Pro adds priority placement and full portfolio."}
            </p>
          </div>
        </div>

        <Button size="sm" onClick={open} disabled={loading || blocked} className="w-full sm:w-auto">
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Opening…</>
          ) : provisioned ? (
            <><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open my listing</>
          ) : (
            <><BadgeCheck className="w-3.5 h-3.5 mr-1.5" /> Create my listing</>
          )}
        </Button>
        {blocked && (
          <p className="text-xs text-muted-foreground">
            Fill in your{" "}
            <Link href="/dashboard/business-profile" className="underline underline-offset-2 hover:text-foreground">
              business profile
            </Link>{" "}
            first — we use it to build the listing.
          </p>
        )}
      </div>
    </div>
  );
}
