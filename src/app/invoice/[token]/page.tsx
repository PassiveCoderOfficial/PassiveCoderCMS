import { createAdminClient } from "@/lib/supabase/server";
import { formatMoney, type InvoiceItem } from "@/lib/invoices/utils";
import { notFound } from "next/navigation";

export const metadata = { title: "Invoice" };

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500 line-through",
};

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();

  const supabase = await createAdminClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();

  if (!invoice || invoice.status === "draft") notFound();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", invoice.tenant_id)
    .single();

  const { data: gateways } = await supabase
    .from("payment_gateways")
    .select("name, description, icon")
    .eq("tenant_id", invoice.tenant_id)
    .eq("is_enabled", true);

  const items = (invoice.items ?? []) as InvoiceItem[];
  const money = (n: number) => formatMoney(Number(n), invoice.currency);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant?.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Invoice {invoice.invoice_number}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLES[invoice.status] ?? ""}`}>
            {invoice.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-400 mb-1">Billed to</p>
            <p className="font-medium text-gray-900">{invoice.customer_name}</p>
            {invoice.customer_email && <p className="text-gray-500">{invoice.customer_email}</p>}
            {invoice.customer_phone && <p className="text-gray-500">{invoice.customer_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-400 mb-1">Issued</p>
            <p className="text-gray-900">{invoice.issue_date}</p>
            {invoice.due_date && (
              <>
                <p className="text-xs uppercase text-gray-400 mb-1 mt-3">Due</p>
                <p className="text-gray-900">{invoice.due_date}</p>
              </>
            )}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-400">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2.5 text-gray-900">{item.description}</td>
                <td className="py-2.5 text-right text-gray-500">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-500">{money(item.unit_price)}</td>
                <td className="py-2.5 text-right text-gray-900">{money(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{money(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount</span><span>−{money(invoice.discount)}</span>
              </div>
            )}
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax</span><span>{money(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Total</span><span>{money(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.status !== "paid" && invoice.status !== "cancelled" && !!gateways?.length && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 print:hidden">
            <p className="text-sm font-semibold text-gray-900 mb-2">How to pay</p>
            <ul className="space-y-1.5">
              {gateways.map((g, i) => (
                <li key={i} className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{g.name}</span>
                  {g.description ? ` — ${g.description}` : ""}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              Reference invoice {invoice.invoice_number} with your payment.
            </p>
          </div>
        )}

        {invoice.status === "paid" && (
          <div className="bg-green-50 text-green-700 rounded-xl p-4 mb-6 text-sm font-medium text-center">
            Paid{invoice.paid_at ? ` on ${new Date(invoice.paid_at).toLocaleDateString()}` : ""} — thank you!
          </div>
        )}

        {invoice.notes && (
          <p className="text-sm text-gray-500 whitespace-pre-wrap border-t border-gray-100 pt-4">{invoice.notes}</p>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-6 print:hidden">
        Use your browser&apos;s print function to save this invoice as PDF.
      </p>
    </div>
  );
}
