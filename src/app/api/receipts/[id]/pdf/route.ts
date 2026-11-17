import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isPanelAdmin } from "@/lib/super-admin";

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
  const sa = await isPanelAdmin(user.id);
  if (!sa) {
    const { data: membership } = await admin
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", payment.tenant_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The receipt is now a printable page (fonts render the taka sign; opens
  // in the browser instead of downloading). Old links land there.
  return NextResponse.redirect(new URL(`/receipts/${id}`, _req.url));
}
