import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { getQuotaStatus } from "@/lib/aicoder/quota";

/**
 * Super admin: see a site's AiCoder balance and grant generations for a
 * payment taken outside Dodo (bKash, bank transfer, cash) — many BD clients
 * can't pay by USD card. Super admin only, not managers: this hands out
 * something worth money. Every grant is a row in ai_credit_ledger (who,
 * how many, what payment reference), same ledger Dodo purchases land in.
 */

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: tenantId } = await params;

  const admin = await createAdminClient();
  const [status, { data: ledger }] = await Promise.all([
    getQuotaStatus(tenantId),
    admin.from("ai_credit_ledger")
      .select("reference, generations, source, amount_cents, currency, note, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (!status) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  return NextResponse.json({ status, ledger: ledger ?? [] });
}

const grantSchema = z.object({
  generations: z.number().int().min(1).max(10000),
  note: z.string().trim().min(3, "Add a note — e.g. the bKash TrxID or bank reference").max(300),
  amount_cents: z.number().int().min(0).nullish(),
  currency: z.string().trim().max(8).nullish(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: tenantId } = await params;

  const parsed = grantSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { generations, note, amount_cents, currency } = parsed.data;

  const admin = await createAdminClient();
  const { error } = await admin.rpc("credit_ai_generations", {
    p_reference: `manual:${randomUUID()}`,
    p_tenant: tenantId,
    p_generations: generations,
    p_source: "manual",
    p_amount_cents: amount_cents ?? null,
    p_currency: currency ?? null,
    p_note: note,
    p_granted_by: caller.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: await getQuotaStatus(tenantId) });
}
