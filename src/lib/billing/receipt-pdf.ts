// Payment receipt PDF (jsPDF). Dynamic import keeps it server-only.
import { formatUsd, receiptAmountLabel, type PayCurrency } from "./money";

export type { PayCurrency };

export interface ReceiptPayment {
  receipt_number: string;
  amount_cents: number;
  currency: PayCurrency;
  orig_amount_minor: number;
  method: string | null;
  paid_at: string;
  is_advance: boolean;
  note: string | null;
}

export interface ReceiptSubscription {
  plan_id: string;
  billing_cycle: string | null;
  total_billed_cents: number | null;
  total_paid_cents: number | null;
  balance_due_cents: number | null;
}

export interface ReceiptTenant {
  name: string | null;
  slug: string | null;
  tenant_number?: number | null;
  owner_email?: string | null;
}

export async function renderReceiptPdf(
  payment: ReceiptPayment,
  sub: ReceiptSubscription,
  tenant: ReceiptTenant,
): Promise<Buffer> {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default ?? (jsPDFModule as unknown as { jsPDF: typeof jsPDFModule.default }).jsPDF;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(22);
  doc.setTextColor(0);
  doc.text("Passive Coder", 20, 22);
  doc.setFontSize(13);
  doc.setTextColor(100);
  doc.text("Payment Receipt", 20, 30);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Receipt #: ${payment.receipt_number}`, 140, 22);
  doc.setTextColor(100);
  doc.text(`Date: ${new Date(payment.paid_at).toLocaleDateString()}`, 140, 29);

  doc.setDrawColor(220);
  doc.line(20, 36, 190, 36);

  // Billed to
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Billed To", 20, 46);
  doc.setFontSize(11);
  doc.setTextColor(70);
  const tName = tenant.name ?? "Client";
  const tNum = tenant.tenant_number ? ` (T${tenant.tenant_number})` : "";
  doc.text(`${tName}${tNum}`, 20, 53);
  if (tenant.slug) doc.text(`${tenant.slug}.passivecoder.com`, 20, 59);
  if (tenant.owner_email) doc.text(tenant.owner_email, 20, 65);

  // Subscription line
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Subscription", 20, 80);
  doc.setFontSize(11);
  doc.setTextColor(70);
  const planLabel = `${capitalize(sub.plan_id)} plan — ${sub.billing_cycle ?? "yearly"}`;
  doc.text(planLabel, 20, 87);

  // Amount paid box
  doc.setDrawColor(220);
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 96, 170, 24, "F");
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Amount Paid", 25, 105);
  doc.setFontSize(16);
  doc.text(receiptAmountLabel(payment), 25, 114);
  if (payment.method) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Method: ${payment.method}${payment.is_advance ? " · Advance" : ""}`, 130, 105);
  }

  // Statement (running balance)
  let y = 134;
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Account Statement", 20, y);
  y += 9;
  doc.setFontSize(11);
  const total = sub.total_billed_cents ?? 0;
  const paid = sub.total_paid_cents ?? 0;
  const due = sub.balance_due_cents ?? Math.max(total - paid, 0);
  const rows: [string, string][] = [
    ["Total billed", formatUsd(total)],
    ["Total paid", formatUsd(paid)],
    ["Balance due", formatUsd(due)],
  ];
  for (const [label, val] of rows) {
    doc.setTextColor(70);
    doc.text(label, 25, y);
    doc.setTextColor(0);
    doc.text(val, 120, y);
    y += 7;
  }

  // Paid stamp
  doc.setFontSize(14);
  doc.setTextColor(due <= 0 ? 30 : 200, due <= 0 ? 160 : 120, 30);
  doc.text(due <= 0 ? "PAID IN FULL" : "PARTIAL PAYMENT", 130, 114);

  if (payment.note) {
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Note: ${payment.note}`, 25, y);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for your business — Passive Coder · passivecoder.com", 20, 285);

  return Buffer.from(doc.output("arraybuffer"));
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
