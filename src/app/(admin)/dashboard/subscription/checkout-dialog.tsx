"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CreditCard, Smartphone, MessageCircle } from "lucide-react";
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

type Method = "dodo" | "shurjopay" | "bkash" | "nagad" | "whatsapp";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function CheckoutDialog({
  open, onOpenChange, tenantId, plan, paymentConfig,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  plan: CheckoutPlan | null;
  paymentConfig: PaymentConfig;
}) {
  const [method, setMethod] = useState<Method>("dodo");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [txnRef, setTxnRef] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const bdtRate = useCurrencyRate();

  if (!plan) return null;

  const priceForCents = (c: BillingCycle): number =>
    (c === "monthly" ? (plan.price_monthly ?? 0) : plan.price_yearly);
  const priceFor = (c: BillingCycle): number => priceForCents(c) / 100;
  const availableCycles = (["monthly", "yearly"] as BillingCycle[]).filter(c => priceFor(c) > 0);
  const activeCycle: BillingCycle = priceFor(cycle) > 0 ? cycle : (availableCycles[0] ?? "yearly");
  const amount = priceFor(activeCycle);
  const amountFormatted = formatCurrency(amount, currency, bdtRate);

  const isBkash = method === "bkash";
  const isNagad = method === "nagad";
  const isManualEntry = isBkash || isNagad;
  const manualNumber = isBkash ? paymentConfig.bkash_number : isNagad ? paymentConfig.nagad_number : null;

  function openWhatsApp() {
    const text = encodeURIComponent(
      `Hi! I'd like to subscribe to Passive Coder *${plan!.name}* plan (${CYCLE_LABELS[activeCycle]}) — ${amountFormatted}${CYCLE_SUFFIX[activeCycle]}. Please assist with payment.`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
  }

  async function submit() {
    if (method === "whatsapp") { openWhatsApp(); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, planId: plan!.id, method, billingCycle: activeCycle, txnRef, senderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      if ((data.mode === "shurjopay" || data.mode === "dodo") && data.checkoutUrl) {
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

  const methods: { id: Method; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "dodo",      label: "Card / PayPal",    icon: <CreditCard className="w-4 h-4" />,    badge: "Intl" },
    { id: "shurjopay", label: "shurjoPay (BD)",   icon: <CreditCard className="w-4 h-4" /> },
    { id: "bkash",     label: "bKash",             icon: <Smartphone className="w-4 h-4" /> },
    { id: "nagad",     label: "Nagad",             icon: <Smartphone className="w-4 h-4" /> },
    { id: "whatsapp",  label: "WhatsApp",          icon: <MessageCircle className="w-4 h-4" />, badge: "Manual" },
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
              <div className="grid grid-cols-2 gap-2">
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
            <span className="text-muted-foreground">{plan.name} ({CYCLE_LABELS[activeCycle].toLowerCase()})</span>
            <span className="font-bold">{amountFormatted}{CYCLE_SUFFIX[activeCycle]}</span>
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
                    "flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors relative",
                    method === m.id ? "border-primary bg-primary/5 font-medium" : "hover:border-primary/40",
                  )}
                >
                  {m.icon}
                  <span>{m.label}</span>
                  {m.badge && (
                    <span className="ml-auto text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{m.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {isManualEntry && (
            <div className="space-y-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {manualNumber
                  ? <>Send <strong>{amountFormatted}</strong> to <strong>{method}</strong> number <strong>{manualNumber}</strong>, then enter the transaction details below.</>
                  : `${method} number not configured — use WhatsApp for manual payment.`}
              </p>
              {paymentConfig.manual_payment_instructions && (
                <p className="text-xs text-muted-foreground">{paymentConfig.manual_payment_instructions}</p>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Your {method} number</Label>
                <Input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transaction ID / reference</Label>
                <Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="e.g. TRX12345" />
              </div>
            </div>
          )}

          {method === "whatsapp" && (
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-3 text-xs text-green-800 dark:text-green-300">
              Opens WhatsApp with a pre-filled message. We&apos;ll confirm payment and activate your plan manually.
            </div>
          )}

          {method === "dodo" && (
            <p className="text-xs text-muted-foreground text-center">
              Secure international card payments via Dodo Payments. Supports Visa, Mastercard, PayPal & more.
            </p>
          )}

          <Button
            onClick={submit}
            disabled={loading || (isManualEntry && !txnRef.trim())}
            className={cn("w-full", method === "whatsapp" ? "bg-green-600 hover:bg-green-700 text-white" : "")}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {method === "dodo"      && <><CreditCard className="w-4 h-4 mr-2" /> Pay with Card / PayPal</>}
            {method === "shurjopay" && <><CreditCard className="w-4 h-4 mr-2" /> Pay with shurjoPay</>}
            {method === "whatsapp"  && <><MessageCircle className="w-4 h-4 mr-2" /> Chat on WhatsApp</>}
            {isManualEntry          && <><CreditCard className="w-4 h-4 mr-2" /> Submit payment</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
