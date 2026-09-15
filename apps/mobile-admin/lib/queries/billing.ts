// Checkout + cancel — the two privileged billing writes, both now
// Bearer-capable (cms/src/app/api/billing/checkout, /billing/dodo/cancel,
// fixed this session). Dodo/shurjoPay checkout is a HOSTED payment page —
// there is no card-form API to call instead, this route always returns a
// checkoutUrl the caller must open in a browser. See lib/checkout-browser.ts
// for how the mobile app opens it and detects the return.

import { apiFetch } from "../api";

export type PaymentMethod = "dodo" | "shurjopay" | "bkash" | "nagad" | "bank";

export interface CheckoutResult {
  ok: boolean;
  mode?: "manual" | "shurjopay" | "dodo";
  checkoutUrl?: string;
  ticketId?: string;
  error?: string;
}

export async function startCheckout(
  tenantId: string,
  input: {
    planId: string;
    method: PaymentMethod;
    billingCycle: "monthly" | "yearly";
    txnRef?: string;
    senderNumber?: string;
    returnUrl?: string;
    cancelUrl?: string;
  },
): Promise<CheckoutResult> {
  const res = await apiFetch<{ ok: boolean; mode: "manual" | "shurjopay" | "dodo"; checkoutUrl?: string; ticketId?: string; error?: string }>(
    "/api/billing/checkout",
    { method: "POST", body: { tenantId, ...input }, tenantId },
  );
  if (!res.ok) return { ok: false, error: res.data.error ?? `Checkout failed (${res.status})` };
  return { ok: true, mode: res.data.mode, checkoutUrl: res.data.checkoutUrl, ticketId: res.data.ticketId };
}

export async function cancelSubscription(tenantId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch<{ ok: boolean; error?: string }>(
    "/api/billing/dodo/cancel",
    { method: "POST", body: { tenantId }, tenantId },
  );
  if (!res.ok) return { ok: false, error: res.data.error ?? `Cancel failed (${res.status})` };
  return { ok: true };
}
