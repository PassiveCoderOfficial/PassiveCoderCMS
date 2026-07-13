import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { normalizePhone } from "@/lib/crm/upsertContact";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const stageId = searchParams.get("stage");
  const tag = searchParams.get("tag");
  const source = searchParams.get("source");
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);

  let query = supabase
    .from("contacts")
    .select("*, crm_stages(id, name, color)", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("last_activity_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,company.ilike.%${q}%`
    );
  }
  if (stageId) query = query.eq("stage_id", stageId);
  if (tag) query = query.contains("tags", [tag]);
  if (source) query = query.eq("source", source);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ contacts: data ?? [], total: count ?? 0, pageSize: PAGE_SIZE });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const phone = normalizePhone(body.phone);

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      tenant_id: tenantId,
      first_name: body.first_name?.trim() || null,
      last_name: body.last_name?.trim() || null,
      email: body.email?.trim().toLowerCase() || null,
      phone,
      whatsapp: normalizePhone(body.whatsapp) ?? phone,
      company: body.company?.trim() || null,
      source: "manual",
      stage_id: body.stage_id || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: body.notes || null,
      consent_email: !!body.consent_email,
      consent_whatsapp: !!body.consent_whatsapp,
    })
    .select("*, crm_stages(id, name, color)")
    .single();

  if (error) {
    const msg = error.code === "23505" ? "A contact with this email or phone already exists" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data);
}
