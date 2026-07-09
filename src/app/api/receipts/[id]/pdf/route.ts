import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import { renderReceiptPdf, type PayCurrency } from "@/lib/billing/receipt-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: payment } = await admin
    .from("subscription_payments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  // Authorize: super admin OR a member of the payment's tenant
  const sa = await isSuperAdmin(user.id);
  if (!sa) {
    const { data: membership } = await admin
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", payment.tenant_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: sub }, { data: tenant }] = await Promise.all([
    admin.from("subscriptions").select("plan_id, billing_cycle, total_billed_cents, total_paid_cents, balance_due_cents").eq("id", payment.subscription_id).maybeSingle(),
    admin.from("tenants").select("name, slug, tenant_number, owner_id").eq("id", payment.tenant_id).maybeSingle(),
  ]);

  let ownerEmail: string | null = null;
  if (tenant?.owner_id) {
    const { data: profile } = await admin.from("profiles").select("email").eq("id", tenant.owner_id).maybeSingle();
    ownerEmail = profile?.email ?? null;
  }

  const pdf = await renderReceiptPdf(
    {
      receipt_number: payment.receipt_number,
      amount_cents: payment.amount_cents,
      currency: payment.currency as PayCurrency,
      orig_amount_minor: payment.orig_amount_minor,
      method: payment.method,
      paid_at: payment.paid_at,
      is_advance: payment.is_advance,
      note: payment.note,
    },
    {
      plan_id: sub?.plan_id ?? "—",
      billing_cycle: sub?.billing_cycle ?? null,
      total_billed_cents: sub?.total_billed_cents ?? null,
      total_paid_cents: sub?.total_paid_cents ?? null,
      balance_due_cents: sub?.balance_due_cents ?? null,
    },
    {
      name: tenant?.name ?? null,
      slug: tenant?.slug ?? null,
      tenant_number: tenant?.tenant_number ?? null,
      owner_email: ownerEmail,
    },
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payment.receipt_number}.pdf"`,
    },
  });
}
