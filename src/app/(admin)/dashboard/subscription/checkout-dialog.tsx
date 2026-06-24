"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CreditCard, Smartphone, Building2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyToggle } from "@/components/ui/currency-toggle";
import { useCurrencyRate, formatCurrency, type Currency } from "@/lib/hooks/use-currency";

export interface CheckoutPlan {
  id: string;
  name: string;
  price_yearly: number;
  price_monthly?: number;
  currency?: string;
}

type BillingCycle = "monthly" | "yearly";
const CYCLE_LABELS: Record<BillingCycle, string> = { monthly: "Monthly", yearly: "Yearly" };
const CYCLE_SUFFIX: Record<BillingCycle, string> = { monthly: "/mo", yearly: "/yr" };

export interface PaymentConfig {
  bkash_number?: string | null;
  nagad_number?: string | null;
  bank_details?: string | null;
  manual_payment_instructions?: string | null;
}

type Method = "shurjopay" | "bkash" | "nagad" | "bank";

export function CheckoutDialog({
  open, onOpenChange, tenantId, plan, paymentConfig,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  plan: CheckoutPlan | null;
  paymentConfig: PaymentConfig;
}) {
  const [method, setMethod] = useState<Method>("shurjopay");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [txnRef, setTxnRef] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const bdtRate = useCurrencyRate();

  if (!plan) return null;
  const isManual = method !== "shurjopay";
  const manualNumber = method === "bkash" ? paymentConfig.bkash_number : method === "nagad" ? paymentConfig.nagad_number : null;

  const priceFor = (c: BillingCycle): number =>
    c === "monthly" ? (plan.price_monthly ?? 0) : plan.price_yearly;
  const availableCycles = (["monthly", "yearly"] as BillingCycle[]).filter(c => priceFor(c) > 0);
  // Fall back to yearly if the selected cycle isn't offered by this plan
  const activeCycle: BillingCycle = priceFor(cycle) > 0 ? cycle : (availableCycles[0] ?? "yearly");
  const amount = priceFor(activeCycle);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, planId: plan!.id, method, billingCycle: activeCycle, txnRef, senderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      if (data.mode === "shurjopay" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toast.success("Payment submitted. We'll activate your plan once verified.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  const methods: { id: Method; label: string; icon: React.ReactNode }[] = [
    { id: "shurjopay", label: "Card / Mobile (shurjoPay)", icon: <CreditCard className="w-4 h-4" /> },
    { id: "bkash", label: "bKash", icon: <Smartphone className="w-4 h-4" /> },
    { id: "nagad", label: "Nagad", icon: <Smartphone className="w-4 h-4" /> },
    { id: "bank", label: "Bank Transfer", icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {plan.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>

          {availableCycles.length > 1 && (
            <div className="space-y-2">
              <Label>Billing cycle</Label>
              <div className="grid grid-cols-3 gap-2">
                {availableCycles.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    className={cn(
                      "rounded-lg border p-2 text-xs transition-colors",
                      activeCycle === c ? "border-primary bg-primary/5 font-semibold" : "hover:border-primary/40",
                    )}
                  >
                    {CYCLE_LABELS[c]}
                    <span className="block text-[10px] text-muted-foreground">{formatCurrency(priceFor(c), currency, bdtRate)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted/40 p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">{plan.name} plan ({CYCLE_LABELS[activeCycle].toLowerCase()})</span>
            <span className="font-bold">{formatCurrency(amount, currency, bdtRate)}{CYCLE_SUFFIX[activeCycle]}</span>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors",
                    method === m.id ? "border-primary bg-primary/5 font-medium" : "hover:border-primary/40",
                  )}
                >
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
          </div>

          {isManual && (
            <div className="space-y-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {method === "bank"
                  ? (paymentConfig.bank_details || "Contact support for bank transfer details.")
                  : manualNumber
                    ? <>Send <strong>{formatCurrency(amount, currency, bdtRate)}</strong> to <strong>{method}</strong> number <strong>{manualNumber}</strong>, then enter the transaction details below.</>

                    : `${method} number not configured yet — contact support.`}
              </p>
              {paymentConfig.manual_payment_instructions && (
                <p className="text-xs text-muted-foreground">{paymentConfig.manual_payment_instructions}</p>
              )}
              {method !== "bank" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Your {method} number</Label>
                  <Input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Transaction ID / reference</Label>
                <Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="e.g. TRX12345 / bank ref" />
              </div>
            </div>
          )}

          <Button onClick={submit} disabled={loading || (isManual && method !== "bank" && !txnRef.trim())} className="w-full">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isManual ? <><CheckCircle className="w-4 h-4 mr-2" /> Submit payment</> : <><CreditCard className="w-4 h-4 mr-2" /> Pay with shurjoPay</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
