import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { sendEmail } from "@/lib/email";
import { computeTotals, tenantBaseUrl, formatMoney, type InvoiceItem } from "@/lib/invoices/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("invoices")
    .select("*").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data: invoice } = await supabase.from("invoices")
    .select("*").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // action: "send" — email the payment link and flip draft → sent
  if (body.action === "send") {
    if (!invoice.customer_email) {
      return NextResponse.json({ error: "Invoice has no customer email" }, { status: 400 });
    }
    const admin = await createAdminClient();
    const { data: tenant } = await admin.from("tenants")
      .select("name, slug, custom_domain, domain_status").eq("id", tenantId).single();

    const url = `${tenantBaseUrl(tenant!)}/invoice/${invoice.public_token}`;
    const result = await sendEmail({
      to: invoice.customer_email,
      subject: `Invoice ${invoice.invoice_number} from ${tenant?.name ?? "us"}`,
      text: [
        `Hi ${invoice.customer_name},`,
        "",
        `Invoice ${invoice.invoice_number} for ${formatMoney(Number(invoice.total), invoice.currency)} is ready.`,
        invoice.due_date ? `Due date: ${invoice.due_date}` : null,
        "",
        `View and pay: ${url}`,
      ].filter((l) => l !== null).join("\n"),
    });
    if (!result.ok) return NextResponse.json({ error: result.error ?? "Email failed" }, { status: 500 });

    const patch: Record<string, unknown> = { sent_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (invoice.status === "draft") patch.status = "sent";
    const { data: updated } = await supabase.from("invoices")
      .update(patch).eq("id", id).eq("tenant_id", tenantId).select().single();

    if (invoice.contact_id) {
      await admin.from("contact_events").insert({
        tenant_id: tenantId, contact_id: invoice.contact_id, type: "invoice",
        title: `Invoice ${invoice.invoice_number} sent`,
        meta: { invoice_id: invoice.id, total: invoice.total },
      });
    }
    return NextResponse.json(updated);
  }

  // Regular field updates
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["customer_name", "customer_email", "customer_phone", "notes",
                     "issue_date", "due_date", "currency", "payment_method"] as const) {
    if (key in body) patch[key] = body[key];
  }
  if ("items" in body || "discount" in body || "tax" in body) {
    const items: InvoiceItem[] = Array.isArray(body.items) ? body.items : invoice.items;
    const discount = "discount" in body ? Number(body.discount) || 0 : Number(invoice.discount);
    const tax = "tax" in body ? Number(body.tax) || 0 : Number(invoice.tax);
    const { subtotal, total } = computeTotals(items, discount, tax);
    Object.assign(patch, { items, discount, tax, subtotal, total });
  }
  if ("status" in body) {
    patch.status = body.status;
    if (body.status === "paid" && !invoice.paid_at) {
      patch.paid_at = new Date().toISOString();
      if (invoice.contact_id) {
        const admin = await createAdminClient();
        await admin.from("contact_events").insert({
          tenant_id: tenantId, contact_id: invoice.contact_id, type: "invoice",
          title: `Invoice ${invoice.invoice_number} paid — ${formatMoney(Number(invoice.total), invoice.currency)}`,
          meta: { invoice_id: invoice.id, total: invoice.total },
        });
      }
    }
  }

  const { data, error } = await supabase.from("invoices")
    .update(patch).eq("id", id).eq("tenant_id", tenantId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("invoices")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
