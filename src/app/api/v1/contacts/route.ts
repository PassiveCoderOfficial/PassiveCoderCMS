import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyApiKey } from "@/lib/api/verifyApiKey";
import { upsertContact, type ContactSource } from "@/lib/crm/upsertContact";

/**
 * Public v1 contacts API (tenant API keys).
 * POST — create/update a contact (lead intake; ENM dispatch lands here).
 * GET  — list contacts, newest activity first (?page, ?q).
 */
export async function POST(req: NextRequest) {
  const ctx = await verifyApiKey(req, "contacts:write");
  if (!ctx) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || (!body.email && !body.phone)) {
    return NextResponse.json({ error: "email or phone required" }, { status: 400 });
  }

  const source: ContactSource = body.source === "enm" ? "enm" : "api";
  const contactId = await upsertContact({
    tenantId: ctx.tenantId,
    email: body.email,
    phone: body.phone,
    whatsapp: body.whatsapp,
    name: body.name,
    firstName: body.first_name,
    lastName: body.last_name,
    company: body.company,
    source,
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : undefined,
    custom: typeof body.custom === "object" && body.custom ? body.custom : undefined,
    consentEmail: !!body.consent_email,
    consentWhatsapp: !!body.consent_whatsapp,
    event: {
      type: "system",
      title: body.event_title || (source === "enm" ? "Lead from Expert Near Me" : "Contact via API"),
      body: body.message || null,
      meta: { via: "api_v1", key_id: ctx.keyId },
    },
  });

  if (!contactId) return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  return NextResponse.json({ id: contactId }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const ctx = await verifyApiKey(req, "contacts:read");
  if (!ctx) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const q = searchParams.get("q")?.trim();

  const supabase = await createAdminClient();
  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, whatsapp, company, source, tags, created_at, last_activity_at", { count: "exact" })
    .eq("tenant_id", ctx.tenantId)
    .order("last_activity_at", { ascending: false })
    .range(page * 50, page * 50 + 49);
  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ contacts: data ?? [], total: count ?? 0, page, pageSize: 50 });
}
