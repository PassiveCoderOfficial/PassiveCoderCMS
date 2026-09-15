// Opens a hosted Dodo/shurjoPay checkout page and detects the return —
// there is no card-form API to call instead (see lib/queries/billing.ts),
// this is genuinely how both gateways work in this codebase. Uses
// WebBrowser.openAuthSessionAsync rather than a bare Linking.openURL
// handoff: it opens a proper in-app browser sheet AND can detect the
// redirect back to our own pcadmin:// scheme, closing itself and reporting
// success/cancel to the caller instead of leaving the customer stranded in
// an external browser tab with no way back into the app.

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

const RETURN_PATH = "checkout-return";
const CANCEL_PATH = "checkout-cancel";

export function checkoutReturnUrl(): string {
  return Linking.createURL(RETURN_PATH);
}
export function checkoutCancelUrl(): string {
  return Linking.createURL(CANCEL_PATH);
}

export type CheckoutOutcome = "paid" | "cancelled" | "dismissed";

/** Opens checkoutUrl in an in-app browser session. Resolves "paid" or
 *  "cancelled" if the gateway redirected back to our own scheme URLs,
 *  "dismissed" if the customer closed the sheet without either (e.g. hit
 *  the device back button) — the caller should re-check the subscription
 *  status rather than assume "dismissed" means nothing happened, since a
 *  webhook can still land after the sheet closes. */
export async function openCheckout(checkoutUrl: string): Promise<CheckoutOutcome> {
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, checkoutReturnUrl());
  if (result.type === "success" && result.url) {
    return result.url.includes(CANCEL_PATH) ? "cancelled" : "paid";
  }
  return "dismissed";
}
