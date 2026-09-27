"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuotaStatus {
  monthlyIncluded: number;
  usedThisMonth: number;
  purchasedRemaining: number;
  freeBuildCredits: number;
  resetAt: string;
}
interface LedgerRow {
  reference: string;
  generations: number;
  source: "dodo" | "manual";
  amount_cents: number | null;
  currency: string | null;
  note: string | null;
  created_at: string;
}

/**
 * AiCoder balance for one site + manual grant for payments taken outside
 * Dodo (bKash / bank). Card purchases credit automatically via the Dodo
 * webhook; both land in the same ledger shown below.
 */
export default function AiCreditsCard({ siteId }: { siteId: string }) {
  const [status, setStatus] = useState<QuotaStatus | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [generations, setGenerations] = useState("50");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/super-admin/sites/${siteId}/ai-credits`);
    if (!res.ok) return;
    const d = await res.json();
    setStatus(d.status);
    setLedger(d.ledger ?? []);
  }, [siteId]);

  useEffect(() => { void load(); }, [load]);

  async function grant() {
    const n = parseInt(generations, 10);
    if (!n || n < 1) { toast.error("Enter how many generations to add"); return; }
    setSaving(true);
    const res = await fetch(`/api/super-admin/sites/${siteId}/ai-credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generations: n,
        note,
        amount_cents: amount ? Math.round(parseFloat(amount) * 100) : null,
        currency: amount ? currency : null,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.error(d.error ?? "Failed to add generations"); return; }
    toast.success(`Added ${n} generations`);
    setNote(""); setAmount("");
    void load();
  }

  const monthlyLeft = status ? Math.max(0, status.monthlyIncluded - status.usedThisMonth) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> AiCoder generations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Plan this month</p>
              <p>{monthlyLeft} / {status.monthlyIncluded} left</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Purchased balance</p>
              <p className="font-medium">{status.purchasedRemaining}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Free build credit</p>
              <p>{status.freeBuildCredits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Monthly reset</p>
              <p>{new Date(status.resetAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Add generations after a manual payment (bKash, bank transfer). Card payments via Dodo are added automatically.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Generations</Label>
              <Input type="number" min={1} value={generations} onChange={(e) => setGenerations(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-xs">Payment reference / note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="bKash TrxID 9ABC12345 — 200 pack" className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Amount received (optional)</Label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="h-8 text-sm mt-1" />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <Button size="sm" onClick={grant} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add generations
              </Button>
            </div>
          </div>
        </div>

        {ledger.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Recent credits</p>
            <ul className="space-y-1 text-xs">
              {ledger.map((r) => (
                <li key={r.reference} className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  <span className="font-medium">+{r.generations}</span>
                  <span className="uppercase text-muted-foreground">{r.source === "dodo" ? "card (Dodo)" : "manual"}</span>
                  {r.amount_cents != null && <span>{(r.amount_cents / 100).toFixed(2)} {r.currency ?? ""}</span>}
                  {r.note && <span className="text-muted-foreground truncate max-w-[20rem]">{r.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
