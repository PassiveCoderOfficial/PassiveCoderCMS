import { ROOT_DOMAIN } from "@/lib/flags";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

/** Keep only well-formed line items: text description, quantity > 0, price >= 0. */
export function cleanItems(raw: unknown): InvoiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 200).map((i) => {
    const r = (i ?? {}) as Record<string, unknown>;
    return {
      ...r,
      description: String(r.description ?? "").slice(0, 500),
      quantity: Math.max(0, Number(r.quantity) || 0),
      unit_price: Math.max(0, Number(r.unit_price) || 0),
    } as InvoiceItem;
  }).filter((i) => i.description.trim() && i.quantity > 0);
}

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];

export function computeTotals(items: InvoiceItem[], discount = 0, tax = 0) {
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));
  return { subtotal: round2(subtotal), total: round2(total) };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Public base URL for a tenant site (custom domain wins over subdomain). */
export function tenantBaseUrl(tenant: { slug: string; custom_domain?: string | null; domain_status?: string | null }) {
  if (tenant.custom_domain && tenant.domain_status === "active") {
    return `https://${tenant.custom_domain}`;
  }
  const proto = ROOT_DOMAIN.startsWith("localhost") ? "http" : "https";
  return `${proto}://${tenant.slug}.${ROOT_DOMAIN}`;
}

/** Next sequential per-tenant invoice number, e.g. INV-0007. */
export function nextInvoiceNumber(latest: string | null | undefined): string {
  const n = latest ? parseInt(latest.replace(/\D/g, ""), 10) || 0 : 0;
  return `INV-${String(n + 1).padStart(4, "0")}`;
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
