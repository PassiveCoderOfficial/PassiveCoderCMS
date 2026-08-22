"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";

export interface PendingActionData {
  id: string;
  tool_name: string;
  human_description: string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
}

export function AgentPendingActionCard({
  action,
  onResolved,
}: {
  action: PendingActionData;
  onResolved: (id: string, status: "confirmed" | "cancelled") => void;
}) {
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);

  async function act(kind: "confirm" | "cancel") {
    setBusy(kind);
    try {
      const res = await fetch(`/api/ai-agent/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id }),
      });
      if (!res.ok) throw new Error();
      onResolved(action.id, kind === "confirm" ? "confirmed" : "cancelled");
    } catch {
      // best-effort UI; leave the card in place so the user can retry
    } finally {
      setBusy(null);
    }
  }

  if (action.status !== "pending") {
    return (
      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {action.human_description} — {action.status}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 space-y-2">
      <p className="text-sm">{action.human_description}</p>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => act("confirm")} disabled={!!busy}>
          {busy === "confirm" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Confirm
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => act("cancel")} disabled={!!busy}>
          {busy === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Cancel
        </Button>
      </div>
    </div>
  );
}
