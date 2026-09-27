/** Wali's WhatsApp: where "make it live" and "paused" buttons send prospects. */
export const DEMO_SALES_WHATSAPP = "8801678669699";

export function normalizeWhatsapp(raw: string): string {
  return raw.replace(/[^\d]/g, "").replace(/^00/, "");
}

export function waLink(number: string, text?: string) {
  const n = normalizeWhatsapp(number);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Demo preview window. Short on purpose: prospects given two weeks wait two
 *  weeks. Paused (never deleted) after this; staff can extend by the same. */
export const DEMO_HOURS = 72;

export function hoursLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 3600_000));
}
