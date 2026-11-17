// Customer order invoice PDF (jsPDF, same engine as billing receipts).
// Standard PDF fonts have no Bangla glyphs or the taka sign, so amounts read
// "Tk 1,250" and non-Latin text is dropped rather than printed as boxes.

export interface InvoiceLine { name: string; quantity: number; price: number }
export interface InvoiceParcel { seller: string | null; number: string | null; lines: InvoiceLine[]; shipping: number; discount: number }
export interface InvoiceData {
  store: { name: string; phone?: string | null; email?: string | null; address?: string | null };
  order: {
    number: string; date: string; status: string; payment_method: string | null; payment_status: string | null;
    subtotal: number; shipping: number; discount: number; total: number;
  };
  billTo: { name?: string; phone?: string; email?: string; address?: string };
  parcels: InvoiceParcel[];
  currency?: string;
}

const latin = (s: unknown) => String(s ?? "").replace(/[^\x20-\x7E -ÿ]/g, "").replace(/\s+/g, " ").trim();
const PAY: Record<string, string> = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad", card: "Card", whatsapp: "WhatsApp order", bank: "Bank transfer" };

export async function renderOrderInvoicePdf(d: InvoiceData): Promise<Buffer> {
  const mod = await import("jspdf");
  const JsPDF = mod.default ?? (mod as unknown as { jsPDF: typeof mod.default }).jsPDF;
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const cur = d.currency ?? "Tk";
  const money = (n: number) => `${cur} ${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const W = 210, L = 16, R = W - 16;
  let y = 20;

  // Header band
  doc.setFillColor(26, 19, 48);
  doc.rect(0, 0, W, 34, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(latin(d.store.name) || "Invoice", L, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const contact = [d.store.phone, d.store.email].map(latin).filter(Boolean).join("  |  ");
  if (contact) doc.text(contact, L, 23);
  if (d.store.address) doc.text(latin(d.store.address).slice(0, 110), L, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", R, 17, { align: "right" });
  y = 46;

  // Order facts + bill to
  doc.setTextColor(26, 19, 48);
  doc.setFontSize(10);
  doc.text("Bill to", L, y);
  doc.text("Order", 120, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70);
  const bill = [d.billTo.name, d.billTo.phone, d.billTo.email, d.billTo.address].map(latin).filter(Boolean);
  let by = y + 6;
  for (const line of bill) for (const part of doc.splitTextToSize(line, 90) as string[]) { doc.text(part, L, by); by += 5; }
  const facts: [string, string][] = [
    ["Invoice no.", `#${latin(d.order.number)}`],
    ["Date", new Date(d.order.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })],
    ["Payment", PAY[d.order.payment_method ?? ""] ?? latin(d.order.payment_method ?? "-")],
    ["Status", latin(d.order.payment_status === "paid" ? "Paid" : d.order.status).replace(/^./, (c) => c.toUpperCase())],
  ];
  let fy = y + 6;
  for (const [k, v] of facts) { doc.setTextColor(120); doc.text(k, 120, fy); doc.setTextColor(26, 19, 48); doc.text(v, R, fy, { align: "right" }); fy += 5; }
  y = Math.max(by, fy) + 6;

  // Items, grouped by seller parcel when there is more than one seller
  const head = () => {
    doc.setFillColor(245, 245, 247);
    doc.rect(L, y - 5, R - L, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Item", L + 2, y);
    doc.text("Qty", 128, y, { align: "right" });
    doc.text("Price", 158, y, { align: "right" });
    doc.text("Amount", R - 2, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 8;
  };
  const room = (h: number) => { if (y + h > 270) { doc.addPage(); y = 20; head(); } };
  head();
  for (const p of d.parcels) {
    if (d.parcels.length > 1 || p.seller) {
      room(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 90, 31);
      doc.text(`Sold by ${latin(p.seller) || "seller"}${p.number ? `  (${latin(p.number)})` : ""}`, L + 2, y);
      doc.setFont("helvetica", "normal");
      y += 6;
    }
    for (const it of p.lines) {
      const name = doc.splitTextToSize(latin(it.name) || "Item", 95) as string[];
      room(name.length * 4.5 + 3);
      doc.setFontSize(9.5);
      doc.setTextColor(26, 19, 48);
      doc.text(name, L + 2, y);
      doc.text(String(it.quantity), 128, y, { align: "right" });
      doc.text(money(it.price), 158, y, { align: "right" });
      doc.text(money(it.price * it.quantity), R - 2, y, { align: "right" });
      y += name.length * 4.5 + 2.5;
      doc.setDrawColor(234, 236, 240);
      doc.line(L, y - 1.5, R, y - 1.5);
      y += 2;
    }
  }

  // Totals
  room(40);
  y += 4;
  const tot: [string, string, boolean?][] = [["Subtotal", money(d.order.subtotal)], ["Delivery", d.order.shipping ? money(d.order.shipping) : "Free"]];
  if (d.order.discount > 0) tot.push(["Discount", `- ${money(d.order.discount)}`]);
  tot.push(["Total", money(d.order.total), true]);
  for (const [k, v, strong] of tot) {
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 12 : 10);
    doc.setTextColor(strong ? 26 : 100, strong ? 19 : 100, strong ? 48 : 100);
    if (strong) { doc.setDrawColor(26, 19, 48); doc.line(120, y - 4.5, R, y - 4.5); }
    doc.text(k, 120, y);
    doc.text(v, R - 2, y, { align: "right" });
    y += strong ? 8 : 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(150);
  doc.text(`Thank you for shopping with ${latin(d.store.name) || "us"}. This is a computer-generated invoice and needs no signature.`, W / 2, 287, { align: "center" });
  return Buffer.from(doc.output("arraybuffer"));
}
