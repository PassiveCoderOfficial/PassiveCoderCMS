/**
 * Dine-in table context: which table a customer scanned into, carried
 * across the scan → browse → checkout journey.
 *
 * Kept separate from CartContext (src/lib/cart/cart-context.tsx) on purpose
 * — a cart is what's being bought, this is where the order goes. Mixing
 * them would mean every cart read/write also has to reason about table
 * state, for a value that changes once per visit, not once per item.
 *
 * Stored in sessionStorage, not localStorage: a scanned table is valid for
 * this visit only. Carrying yesterday's table token into today's order
 * (localStorage would do that) risks a kitchen order being silently routed
 * to a table that customer isn't sitting at anymore.
 */

const STORAGE_KEY = "dine_in_table_qr_token";

export function setDineInTableToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Private browsing / storage disabled — dine-in simply won't survive a
    // navigation, checkout falls back to asking for pickup/delivery instead.
  }
}

export function getDineInTableToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearDineInTableToken() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage never worked.
  }
}
