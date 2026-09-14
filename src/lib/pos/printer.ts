// Printer bridge (Phase 5, docs/business/06-restaurant-vertical.md) — deferred
// since Phase 5, shipped now that a real Biz customer exists. Sunmi Android
// POS terminals (the recommended device, see printer-notice.tsx) expose a
// JS bridge on window.sunmiPrinter once their WebView wrapper injects it;
// call it directly if present. Any other device (a laptop/tablet running
// the dashboard in a normal browser, or a Sunmi unit before the bridge
// finishes injecting) falls back to the browser's own print dialog against
// a small receipt-shaped HTML window — nothing ever breaks for a customer
// without the hardware, exactly the design decided in Phase 5.

export interface ReceiptLine { name: string; quantity: number; price: number }
export interface ReceiptData {
  orderNumber: string;
  siteName: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  tableLabel?: string | null;
  splitLabel?: string | null;
  paymentMethod?: string;
  timestamp?: string;
}

interface SunmiPrinterBridge {
  // Sunmi's actual InnerPrinter JS SDK exposes many more methods
  // (setAlignment, printBarCode, etc) — only the handful this receipt
  // format needs are declared, not the full SDK surface.
  printText?: (text: string, callback?: () => void) => void;
  printTextWithFont?: (text: string, typeface: string, size: number, callback?: () => void) => void;
  lineWrap?: (lines: number, callback?: () => void) => void;
  cutPaper?: (callback?: () => void) => void;
  printerInit?: (callback?: () => void) => void;
}

declare global {
  interface Window {
    sunmiPrinter?: SunmiPrinterBridge;
  }
}

/** Sunmi's WebView bridge is injected asynchronously by the native shell —
 *  it may not exist yet on the very first paint even on real Sunmi
 *  hardware, so this is checked at print time, not cached at module load. */
export function hasSunmiPrinter(): boolean {
  return typeof window !== "undefined" && !!window.sunmiPrinter?.printText;
}

function money(n: number, currency: string): string {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}

/** Plain-text receipt body, 32 columns — the standard width for a 58mm
 *  thermal printer (the Sunmi V2 Pro's built-in printer), so this reads
 *  correctly on the actual hardware, not just readably in a browser tab. */
function formatReceiptText(r: ReceiptData): string {
  const W = 32;
  const line = (s = "") => s.padEnd(W).slice(0, W);
  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((W - s.length) / 2));
    return " ".repeat(pad) + s;
  };
  const rule = "-".repeat(W);
  const twoCol = (left: string, right: string) => {
    const space = Math.max(1, W - left.length - right.length);
    return left + " ".repeat(space) + right;
  };

  const out: string[] = [];
  out.push(center(r.siteName));
  out.push(center(r.orderNumber));
  if (r.tableLabel) out.push(center(r.tableLabel));
  if (r.splitLabel) out.push(center(r.splitLabel));
  out.push(line(r.timestamp ?? new Date().toLocaleString()));
  out.push(rule);
  for (const l of r.lines) {
    out.push(line(`${l.quantity}x ${l.name}`));
    out.push(twoCol("", money(l.price * l.quantity, r.currency)));
  }
  out.push(rule);
  out.push(twoCol("Subtotal", money(r.subtotal, r.currency)));
  if (r.discount > 0) out.push(twoCol("Discount", `-${money(r.discount, r.currency)}`));
  out.push(twoCol("TOTAL", money(r.total, r.currency)));
  if (r.paymentMethod) out.push(line(`Paid: ${r.paymentMethod}`));
  out.push("");
  out.push(center("Thank you!"));
  out.push("\n\n\n"); // feed before cut
  return out.join("\n");
}

/** Prints via the Sunmi bridge if present, otherwise opens the browser's
 *  print dialog against a receipt-formatted popup window. Never throws —
 *  a printer failure shouldn't block completing a sale, it's reported back
 *  as a boolean so the caller can show a quiet "couldn't print" note. */
export function printReceipt(data: ReceiptData): boolean {
  if (hasSunmiPrinter()) {
    try {
      const p = window.sunmiPrinter!;
      p.printerInit?.();
      p.printText?.(formatReceiptText(data));
      p.lineWrap?.(4);
      p.cutPaper?.();
      return true;
    } catch {
      // Bridge exists but the actual call failed (firmware quirk, printer
      // out of paper reported as an exception rather than a callback) —
      // fall through to the browser dialog rather than losing the receipt.
    }
  }
  return printViaBrowser(data);
}

function printViaBrowser(data: ReceiptData): boolean {
  if (typeof window === "undefined") return false;
  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return false; // popup blocked — caller shows the "couldn't print" note

  const rowsHtml = data.lines.map(l => `
    <tr><td>${l.quantity}× ${escapeHtml(l.name)}</td><td style="text-align:right">${money(l.price * l.quantity, data.currency)}</td></tr>
  `).join("");

  win.document.write(`<!doctype html><html><head><title>${escapeHtml(data.orderNumber)}</title>
    <style>
      body { font-family: monospace; font-size: 13px; width: 280px; margin: 0 auto; padding: 16px 0; }
      h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
      p { text-align: center; margin: 2px 0; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      td { padding: 2px 0; font-size: 12px; }
      hr { border: none; border-top: 1px dashed #000; }
      .total { font-weight: bold; font-size: 14px; }
    </style></head><body>
    <h1>${escapeHtml(data.siteName)}</h1>
    <p>${escapeHtml(data.orderNumber)}</p>
    ${data.tableLabel ? `<p>${escapeHtml(data.tableLabel)}</p>` : ""}
    ${data.splitLabel ? `<p>${escapeHtml(data.splitLabel)}</p>` : ""}
    <p>${escapeHtml(data.timestamp ?? new Date().toLocaleString())}</p>
    <hr />
    <table>${rowsHtml}</table>
    <hr />
    <table>
      <tr><td>Subtotal</td><td style="text-align:right">${money(data.subtotal, data.currency)}</td></tr>
      ${data.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${money(data.discount, data.currency)}</td></tr>` : ""}
      <tr class="total"><td>TOTAL</td><td style="text-align:right">${money(data.total, data.currency)}</td></tr>
    </table>
    ${data.paymentMethod ? `<p>Paid: ${escapeHtml(data.paymentMethod)}</p>` : ""}
    <p>Thank you!</p>
    <script>window.onload = () => { window.print(); };</script>
  </body></html>`);
  win.document.close();
  return true;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
