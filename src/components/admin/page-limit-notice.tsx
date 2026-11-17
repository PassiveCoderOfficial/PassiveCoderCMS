"use client";

import Link from "next/link";
import { toast } from "sonner";
import { PAGE_LIMIT_UPGRADE_HREF } from "@/lib/usage/page-limit";

/** Inline notice for the plan's page limit, with a link to the plan page. */
export function PageLimitNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
      {message}{" "}
      <Link href={PAGE_LIMIT_UPGRADE_HREF} className="font-semibold underline underline-offset-2">
        View plans
      </Link>
    </div>
  );
}

/** Same message as a toast, for flows with no room for an inline notice. */
export function toastPageLimit(message: string) {
  toast.error(message, {
    duration: 10000,
    action: { label: "View plans", onClick: () => { window.location.href = PAGE_LIMIT_UPGRADE_HREF; } },
  });
}
