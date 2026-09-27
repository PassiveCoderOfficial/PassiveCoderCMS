/** Wali's WhatsApp: where "make it live" and "paused" buttons send prospects. */
export const DEMO_SALES_WHATSAPP = "8801678669699";

export function normalizeWhatsapp(raw: string): string {
  return raw.replace(/[^\d]/g, "").replace(/^00/, "");
}

export function waLink(number: string, text?: string) {
  const n = normalizeWhatsapp(number);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
