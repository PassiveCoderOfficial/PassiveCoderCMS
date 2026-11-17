import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiSupabase } from "@/lib/auth/api-caller";
import { sendEmail } from "@/lib/email";

type Msg = { from: "customer" | "store"; text: string; at: string; via?: "email" | "whatsapp" | "note" };

/**
 * Store answers a price request: add a reply (emailed to the shopper when
 * they left an email), optionally set the product's price, change status.
 * The user's own session does the read/write, so RLS (tenant editor) guards it.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Cookie session on the web, Bearer token from the mobile app; RLS applies either way.
  const supabase = await apiSupabase(req);
  const { data: r } = await supabase.from("price_requests").select("*").eq("id", id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { reply?: string; via?: Msg["via"]; price?: number | string | null; status?: "open" | "quoted" | "closed" };
  const thread = [...((r.thread ?? []) as Msg[])];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const reply = (body.reply ?? "").trim().slice(0, 2000);
  const price = body.price === "" || body.price === null || body.price === undefined ? null : Number(body.price);
  if (price !== null && (Number.isNaN(price) || price < 0)) return NextResponse.json({ error: "Invalid price" }, { status: 400 });

  if (price !== null && r.product_id) {
    const { error } = await supabase.from("products").update({ price, updated_at: new Date().toISOString() }).eq("id", r.product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    patch.quoted_price = price;
    patch.status = "quoted";
  }

  let emailed = false;
  if (reply) {
    const via = body.via ?? (r.email ? "email" : "note");
    if (via === "email" && r.email) {
      const res = await sendEmail({
        to: r.email, brandTenantId: r.tenant_id,
        subject: `Price for ${r.product_name}`,
        text: `Hi ${r.name},\n\n${reply}\n\nProduct: ${r.product_name}${r.quantity ? `\nQuantity: ${r.quantity}` : ""}`,
      }).catch(() => ({ ok: false }));
      emailed = !!res?.ok;
    }
    thread.push({ from: "store", text: reply, at: new Date().toISOString(), via: emailed ? "email" : via === "whatsapp" ? "whatsapp" : "note" });
    patch.thread = thread;
    if (!patch.status && r.status === "open") patch.status = "quoted";
  }
  if (body.status) patch.status = body.status;

  const admin = await createAdminClient();
  const { data, error } = await admin.from("price_requests").update(patch).eq("id", id).eq("tenant_id", r.tenant_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ request: data, emailed });
}
