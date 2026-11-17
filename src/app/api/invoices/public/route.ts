import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { tooMany } from "@/lib/rate-limit";
import { notifyTenantEvent } from "@/lib/push/notify";

/**
 * POST { token, method, reference }: the customer reports a payment from the
 * public invoice page (/invoice/[token]). Records it on the invoice and
 * pushes the business; they mark the invoice paid once the money shows up.
 */
export async function POST(req: Request) {
  const limited = tooMany(req, "invoice-pay", 10);
  if (limited) return limited;
  const b = (await req.json().catch(() => ({}))) as { token?: string; method?: string; reference?: string };
  const token = String(b.token ?? "");
  const reference = String(b.reference ?? "").trim().slice(0, 120);
  const method = String(b.method ?? "").trim().slice(0, 60);
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!reference) return NextResponse.json({ error: "Enter the transaction ID or reference" }, { status: 400 });

  const admin = await createAdminClient();
  const { data: inv } = await admin.from("invoices").select("id, tenant_id, invoice_number, status, total, currency, customer_name").eq("public_token", token).maybeSingle();
  if (!inv || inv.status === "draft") return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (inv.status === "paid") return NextResponse.json({ ok: true, already: true });

  const { error } = await admin.from("invoices").update({
    payment_reference: reference, payment_reported_method: method || null, payment_reported_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", inv.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await notifyTenantEvent({
    tenantId: inv.tenant_id, type: "payment", id: inv.id, path: `invoices/${inv.id}`, dedupeKey: `invoice-reported:${inv.id}:${reference}`,
    title: `Payment reported on ${inv.invoice_number}`,
    body: `${inv.customer_name ?? "Customer"} says they paid${method ? ` by ${method}` : ""}, reference ${reference}. Check it and mark the invoice paid.`,
    webUrl: "/dashboard/invoices",
  });
  return NextResponse.json({ ok: true });
}
