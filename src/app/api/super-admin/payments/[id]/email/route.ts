import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import { renderReceiptPdf, type PayCurrency } from "@/lib/billing/receipt-pdf";
import { receiptAmountLabel } from "@/lib/billing/money";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  const { data: payment } = await admin.from("subscription_payments").select("*").eq("id", id).maybeSingle();
  if (!payment) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const [{ data: sub }, { data: tenant }] = await Promise.all([
    admin.from("subscriptions").select("plan_id, billing_cycle, total_billed_cents, total_paid_cents, balance_due_cents").eq("id", payment.subscription_id).maybeSingle(),
    admin.from("tenants").select("name, slug, tenant_number, owner_id").eq("id", payment.tenant_id).maybeSingle(),
  ]);

  let ownerEmail: string | null = null;
  if (tenant?.owner_id) {
    const { data: profile } = await admin.from("profiles").select("email").eq("id", tenant.owner_id).maybeSingle();
    ownerEmail = profile?.email ?? null;
  }
  if (!ownerEmail) return NextResponse.json({ error: "Client has no email on file" }, { status: 400 });

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
    { name: tenant?.name ?? null, slug: tenant?.slug ?? null, tenant_number: tenant?.tenant_number ?? null, owner_email: ownerEmail },
  );

  const amountLabel = receiptAmountLabel({
    amount_cents: payment.amount_cents,
    currency: payment.currency as PayCurrency,
    orig_amount_minor: payment.orig_amount_minor,
  });

  const result = await sendEmail({
    to: ownerEmail,
    subject: `Payment receipt ${payment.receipt_number} — Passive Coder`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px">
        <h2 style="color:#111">Payment Received</h2>
        <p>Hi ${tenant?.name ?? "there"},</p>
        <p>Thank you — we've received your payment of <strong>${amountLabel}</strong> for your
        ${sub?.plan_id ? `<strong>${sub.plan_id}</strong> plan` : "subscription"}.</p>
        <p>Your receipt <strong>${payment.receipt_number}</strong> is attached as a PDF.</p>
        <p style="color:#666;font-size:13px">Passive Coder · passivecoder.com</p>
      </div>`,
    attachments: [{ filename: `${payment.receipt_number}.pdf`, content: pdf.toString("base64") }],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error === "email_not_configured" ? "Email not configured (RESEND_API_KEY missing)" : (result.error ?? "Failed to send") }, { status: 502 });
  }

  await admin.from("subscription_payments").update({ emailed_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true, sentTo: ownerEmail });
}
