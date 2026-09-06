import React from "react";
import Link from "next/link";
import { User } from "lucide-react";
import type { HeaderAccountBlockProps } from "@/types/cms";

/**
 * Independent header sub-block: links to the customer account area built
 * alongside this block (2026-09-06) — /account/orders when signed in,
 * /account/login otherwise. See project_block_editor_bugs memory for why
 * this needed a real customer auth system before this block could point
 * anywhere meaningful: no customer-facing login existed before this pass,
 * only staff/admin login, which would have been the wrong destination.
 *
 * Purely presentational — takes `isSignedIn` as a prop rather than checking
 * auth itself, so this one file works for both the editor canvas (which has
 * no visitor session to check, and should just show the signed-out state —
 * the correct default preview) and the published site (which checks auth in
 * page-renderer.tsx, the one place that already knows how to do that per
 * request, same as every other server-data block here).
 */
export function HeaderAccountBlock({ block, isSignedIn = false }: { block: HeaderAccountBlockProps; isSignedIn?: boolean }) {
  const showLabel = block.data.showLabel ?? false;
  const href = isSignedIn ? "/account/orders" : "/account/login";

  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-current/10 transition-colors shrink-0"
      aria-label={isSignedIn ? "My account" : "Sign in"}
    >
      <User className="h-5 w-5" />
      {showLabel && <span className="text-sm font-medium">{isSignedIn ? "Account" : "Sign in"}</span>}
    </Link>
  );
}
