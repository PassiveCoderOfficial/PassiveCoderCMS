"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Globe, Server, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  CARE_COLUMNS, DEV_COLUMNS, formatAmount, quote,
  type CareCycle, type CarePlan, type Currency, type DevPackage, type QuoteKind,
} from "@/lib/pricing/catalog";
import type { PaymentConfig } from "./checkout-dialog";

/** Subscription fields this panel reads (pricing v2, migration 137). */
export interface V2Sub {
  tenant_id: string;
  plan_id: string | null;
  status: string;
  development_paid_at?: string | null;
  platform_paid_until?: string | null;
  care_plan_id?: string | null;
  care_cycle?: string | null;
  care_paid_until?: string | null;
  care_is_free?: boolean | null;
  pending_kind?: string | null;
}

type Method = "bkash" | "nagad" | "bank" | "shurjopay" | "dodo";

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null);
const isFuture = (d?: string | null) => !!d && new Date(d) > new Date();

function useCatalog() {
  const [packages, setPackages] = useState<DevPackage[]>([]);
  const [care, setCare] = useState<CarePlan[]>([]);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("plans").select(DEV_COLUMNS).eq("is_active", true).not("dev_price_usd_cents", "is", null).order("sort_order"),
      sb.from("care_plans").select(CARE_COLUMNS).eq("is_active", true).order("sort_order"),
    ]).then(([p, c]) => {
      setPackages((p.data ?? []) as unknown as DevPackage[]);
      setCare((c.data ?? []) as unknown as CarePlan[]);
    });
  }, []);
  return { packages, care };
}

/** Billing status + actions for one site under pricing v2. */
export function SiteBillingV2({ tenantId, sub, paymentConfig }: { tenantId: string; sub: V2Sub | null; paymentConfig: PaymentConfig }) {
  const { packages, care } = useCatalog();
  const [open, setOpen] = useState<{ kind: QuoteKind; planId?: string; careId?: string } | null>(null);
  const pkg = packages.find((p) => p.id === sub?.plan_id) ?? null;
  const carePlan = care.find((c) => c.id === sub?.care_plan_id) ?? null;
  const devPaid = !!sub?.development_paid_at;
  const platformOn = isFuture(sub?.platform_paid_until);
  const careOn = isFuture(sub?.care_paid_until);

  if (!packages.length) return <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {sub?.pending_kind && (
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> A payment for {sub.pending_kind} is awaiting confirmation.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Status
          icon={Globe}
          title="Website"
          ok={devPaid}
          line={devPaid ? `${pkg?.name ?? sub?.plan_id} package, paid` : "Not paid yet"}
          action={!devPaid ? { label: "Pay for website", onClick: () => setOpen({ kind: "development", planId: sub?.plan_id ?? "pro" }) } : undefined}
        />
        <Status
          icon={Server}
          title="Platform"
          ok={platformOn || careOn}
          line={platformOn ? `Paid until ${fmtDate(sub?.platform_paid_until)}` : careOn ? "Covered by Care" : "Renewal due"}
          action={devPaid && !careOn ? { label: "Renew 12 months", onClick: () => setOpen({ kind: "platform", planId: sub?.plan_id ?? undefined }) } : undefined}
        />
        <Status
          icon={Wrench}
          title="Care"
          ok={careOn}
          line={careOn ? `${carePlan?.name ?? "Care"}${sub?.care_is_free ? " (free)" : ""} until ${fmtDate(sub?.care_paid_until)}` : "Not active"}
          action={{ label: careOn ? "Extend or change" : "Add Care", onClick: () => setOpen({ kind: "care", careId: sub?.care_plan_id ?? "care_pro" }) }}
        />
      </div>

      {!devPaid && (
        <button
          onClick={() => setOpen({ kind: "bundle", planId: sub?.plan_id ?? "pro", careId: "care_pro" })}
          className="w-full text-left rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-muted/50"
        >
          <span className="font-semibold">Website + 1 year Care in one payment</span>
          <span className="text-muted-foreground"> · save 10% on Care</span>
        </button>
      )}

      <BuyDialog
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        tenantId={tenantId}
        init={open}
        packages={packages}
        care={care}
        paymentConfig={paymentConfig}
      />
    </div>
  );
}

function Status({ icon: Icon, title, ok, line, action }: {
  icon: React.ElementType; title: string; ok: boolean; line: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-lg border p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="w-4 h-4 text-muted-foreground" /> {title}
        {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" /> : <AlertTriangle className="w-4 h-4 text-amber-500 ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground flex-1">{line}</p>
      {action && <Button size="sm" variant="outline" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

const KIND_TITLE: Record<QuoteKind, string> = {
  development: "Pay for your website",
  platform: "Renew platform (12 months)",
  care: "Care plan",
  bundle: "Website + 1 year Care",
};

function BuyDialog({ open, onOpenChange, tenantId, init, packages, care, paymentConfig }: {
  open: boolean; onOpenChange: (v: boolean) => void; tenantId: string;
  init: { kind: QuoteKind; planId?: string; careId?: string } | null;
  packages: DevPackage[]; care: CarePlan[]; paymentConfig: PaymentConfig;
}) {
  const [kind, setKind] = useState<QuoteKind>("development");
  const [planId, setPlanId] = useState("pro");
  const [careId, setCareId] = useState("care_pro");
  const [cycle, setCycle] = useState<CareCycle>("yearly");
  const [method, setMethod] = useState<Method>("bkash");
  const [txnRef, setTxnRef] = useState("");
  const [sender, setSender] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!init) return;
    /* eslint-disable react-hooks/set-state-in-effect -- sync form to the action that opened the dialog */
    setKind(init.kind);
    if (init.planId) setPlanId(init.planId);
    if (init.careId) setCareId(init.careId);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [init]);

  const currency: Currency = method === "dodo" ? "USD" : "BDT";
  const pkg = packages.find((p) => p.id === planId) ?? null;
  const cp = care.find((c) => c.id === careId) ?? null;
  const q = useMemo(() => {
    try { return quote({ kind, currency, pkg, care: cp, careCycle: cycle }); } catch { return null; }
  }, [kind, currency, pkg, cp, cycle]);
  const manual = method === "bkash" || method === "nagad" || method === "bank";
  const showPkg = kind === "development" || kind === "bundle";
  const showCare = kind === "care" || kind === "bundle";

  async function pay() {
    if (manual && !txnRef.trim()) { toast.error("Enter the transaction reference"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, kind, method, planId: showPkg || kind === "platform" ? planId : undefined, careId: showCare ? careId : undefined, careCycle: cycle, txnRef, senderNumber: sender }),
      });
      const j = await res.json();
      if (!res.ok) { toast.error(j.error ?? "Payment could not start"); return; }
      if (j.checkoutUrl) { window.location.href = j.checkoutUrl; return; }
      toast.success("Payment submitted. We will confirm it shortly.");
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 900);
    } finally {
      setBusy(false);
    }
  }

  const methodNumber = method === "bkash" ? paymentConfig.bkash_number : method === "nagad" ? paymentConfig.nagad_number : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{KIND_TITLE[kind]}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {showPkg && (
            <Choice label="Package" value={planId} onChange={setPlanId}
              options={packages.map((p) => [p.id, `${p.name} · ${p.pages_built} pages · ${formatAmount(currency === "USD" ? p.dev_price_usd_cents : p.dev_price_bdt, currency)}`])} />
          )}
          {showCare && (
            <Choice label="Care plan" value={careId} onChange={setCareId}
              options={care.map((c) => [c.id, `${c.name} · ${formatAmount(currency === "USD" ? c.monthly_usd_cents : c.monthly_bdt, currency)}/month`])} />
          )}
          {kind === "care" && (
            <Choice label="Billing" value={cycle} onChange={(v) => setCycle(v as CareCycle)}
              options={[["monthly", "Monthly"], ["yearly", "Yearly (4 months free)"]]} />
          )}
          <Choice label="Payment method" value={method} onChange={(v) => setMethod(v as Method)}
            options={[["bkash", "bKash"], ["nagad", "Nagad"], ["bank", "Bank transfer"], ["shurjopay", "shurjoPay (card, mobile banking)"], ["dodo", "International card (USD)"]]} />

          {manual && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
              {methodNumber && <p>Send money to <span className="font-mono font-semibold">{methodNumber}</span></p>}
              {method === "bank" && paymentConfig.bank_details && <p className="whitespace-pre-line">{paymentConfig.bank_details}</p>}
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Your number</Label><Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX" /></div>
                <div><Label className="text-xs">Transaction ID</Label><Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} /></div>
              </div>
            </div>
          )}

          {q && (
            <div className="rounded-lg border p-3 text-sm space-y-1">
              {q.lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className={cn(l.value < 0 && "text-emerald-600")}>{formatAmount(l.value, currency)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-1 border-t mt-1">
                <span>Total</span><span>{formatAmount(q.total, currency)}</span>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={pay} disabled={busy || !q}>
            {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {manual ? "Submit payment" : "Continue to payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="grid gap-1.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={cn("text-left text-sm rounded-md border px-3 py-2", value === v ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50")}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
