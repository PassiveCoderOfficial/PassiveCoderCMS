/**
 * What a shopper sees for a product with no price (products.price is null).
 * The store sets a default in site_settings.product_defaults.noPrice
 * (Ecommerce → Settings); a product can override it in
 * products.attributes.noPrice (product editor → Pricing).
 */
export type NoPriceMode = "whatsapp" | "request" | "zero";
export type NoPriceSetting = { mode?: NoPriceMode; label?: string };

export const NO_PRICE_MODES: { value: NoPriceMode; label: string; hint: string }[] = [
  { value: "whatsapp", label: "Message for Price", hint: "Button opens WhatsApp with the product name filled in." },
  { value: "request", label: "Request Price", hint: "Shopper sends a request; you answer from Ecommerce → Price Requests and can set the price there." },
  { value: "zero", label: "Show price as 0", hint: "Shows 0 and lets the product go into the cart. You confirm the price with the order." },
];

export const DEFAULT_NO_PRICE: Required<NoPriceSetting> = { mode: "whatsapp", label: "Message for Price" };

export function defaultLabel(mode: NoPriceMode): string {
  return mode === "request" ? "Request Price" : mode === "whatsapp" ? "Message for Price" : "";
}

/** The product's own choice, else the store's, else Message for Price. */
export function resolveNoPrice(own?: NoPriceSetting | null, store?: NoPriceSetting | null): Required<NoPriceSetting> {
  const mode = own?.mode ?? store?.mode ?? DEFAULT_NO_PRICE.mode;
  const label = (own?.mode ? own.label : undefined) || (store?.mode === mode ? store.label : undefined) || defaultLabel(mode);
  return { mode, label };
}

export function hasPrice(price: number | string | null | undefined): price is number | string {
  return price !== null && price !== undefined && price !== "";
}
