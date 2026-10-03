import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { siteAccess } from "@/lib/mcp/auth";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  status: z.enum(["pending", "processing", "on_hold", "completed", "cancelled", "refunded", "failed"]).optional(),
  payment_status: z.enum(["pending", "paid", "failed", "refunded", "partially_refunded"]).optional(),
  notes: z.string().max(5000).optional(),
  notify: z.boolean().optional(),
});

const STATUS_TEXT: Record<string, string> = {
  pending: "received and waiting to be processed",
  processing: "being prepared",
  on_hold: "on hold. We'll be in touch shortly",
  completed: "complete. Thank you for your order",
  cancelled: "cancelled",
  refunded: "refunded",
  failed: "unsuccessful",
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Update an order's status / payment status / internal notes, optionally emailing the customer. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = await apiTenantId();
  if (!user || !tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  if ((await siteAccess(admin, user.id, tenantId)) !== "write") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { notify, ...patch } = parsed.data;
  const { id } = await params;

  const { data: order, error } = await admin.from("orders")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id).eq("tenant_id", tenantId)
    .select("id, order_number, status, payment_status, customer_email, customer_name").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let emailed = false;
  if (notify && patch.status && order.customer_email) {
    const { data: s } = await admin.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle();
    const shop = (s?.site_name as string) || "Our shop";
    const r = await sendEmail({
      to: order.customer_email,
      from: `${shop.replace(/[<>"]/g, "")} <contact@noreply.passivecoder.com>`,
      subject: `Your order #${order.order_number} update`,
      html: `<p>Hi ${esc(order.customer_name ?? "there")},</p><p>Your order <b>#${esc(order.order_number)}</b> is ${STATUS_TEXT[patch.status] ?? esc(patch.status)}.</p><p>${esc(shop)}</p>`,
    });
    emailed = r.ok;
  }
  return NextResponse.json({ ok: true, order, emailed });
}
