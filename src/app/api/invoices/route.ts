import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { computeTotals, nextInvoiceNumber, type InvoiceItem } from "@/lib/invoices/utils";
import { upsertContact } from "@/lib/crm/upsertContact";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase.from("invoices")
    .select("*").eq("tenant_id", tenantId)
    .order("created_at", { ascending: false }).limit(200);
  if (status && status !== "all") query = query.eq("status", status);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const items: InvoiceItem[] = Array.isArray(body.items) ? body.items : [];
  if (!body.customer_name?.trim()) {
    return NextResponse.json({ error: "Customer name required" }, { status: 400 });
  }
  if (!items.length) {
    return NextResponse.json({ error: "At least one line item required" }, { status: 400 });
  }

  const { subtotal, total } = computeTotals(items, body.discount, body.tax);

  const { data: latest } = await supabase.from("invoices")
    .select("invoice_number").eq("tenant_id", tenantId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  // CRM: invoice customer becomes/updates a contact
  const contactId = await upsertContact({
    tenantId,
    email: body.customer_email,
    phone: body.customer_phone,
    name: body.customer_name,
    source: "manual",
    event: {
      type: "invoice",
      title: `Invoice created — ${body.currency ?? "USD"} ${total}`,
      meta: { total },
    },
  }).catch(() => null);

  const { data, error } = await supabase.from("invoices")
    .insert({
      tenant_id: tenantId,
      contact_id: contactId,
      invoice_number: nextInvoiceNumber(latest?.invoice_number),
      currency: body.currency?.trim().toUpperCase() || "USD",
      customer_name: body.customer_name.trim(),
      customer_email: body.customer_email?.trim().toLowerCase() || null,
      customer_phone: body.customer_phone?.trim() || null,
      items,
      subtotal,
      discount: Number(body.discount) || 0,
      tax: Number(body.tax) || 0,
      total,
      notes: body.notes?.trim() || null,
      issue_date: body.issue_date || undefined,
      due_date: body.due_date || null,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
