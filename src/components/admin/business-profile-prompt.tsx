"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, ArrowRight } from "lucide-react";

/**
 * Dashboard prompt for the business profile.
 *
 * The profile feeds AI content generation, the site's own contact and services
 * sections — but it lives on a page nobody has a
 * reason to visit, so without a prompt it simply never gets filled in.
 *
 * Renders nothing once the profile is complete, and nothing while loading, so
 * a completed account never sees a flash of an obsolete task.
 */
export function BusinessProfilePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/business-profile")
      .then(r => r.json())
      .then(d => setShow(!d.profile?.completed_at))
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    // Fixed cream card with explicit text colours: `dark:` follows the OS while
    // the dashboard theme is a .dark class, so themed text went white on cream.
    <div className="rounded-xl border border-orange-200 bg-orange-50 text-orange-950 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
        <Briefcase className="w-4.5 h-4.5 text-orange-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Complete your business profile</p>
        <p className="text-xs text-orange-900/80 mt-0.5">
          Takes about 3 minutes. We use it to write your website content and fill in your contact and services sections.
        </p>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link href="/dashboard/business-profile">
          Fill it in <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
      </Button>
    </div>
  );
}
