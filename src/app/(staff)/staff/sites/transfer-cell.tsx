"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import { TransferSiteDialog } from "@/components/admin/transfer-site-dialog";

/**
 * Per-row handover control for the staff site list.
 *
 * The staff list is a server component and a table row is too cramped for the
 * full form, so this renders a small trigger that expands the shared dialog
 * beneath the table instead of inline in the cell.
 */
export function TransferCell({ tenantId, siteName }: { tenantId: string; siteName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <UserCheck className="w-3 h-3" /> {open ? "Close" : "Hand over"}
      </button>
      {open && (
        <div className="mt-2 w-[320px]">
          <TransferSiteDialog
            tenantId={tenantId}
            siteName={siteName}
            defaultOpen
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
