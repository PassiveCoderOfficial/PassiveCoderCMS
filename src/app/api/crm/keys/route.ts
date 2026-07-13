import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { generateApiKey } from "@/lib/api/verifyApiKey";

export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("tenant_api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, revoked_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { raw, prefix, hash } = generateApiKey();

  const { data, error } = await supabase.from("tenant_api_keys")
    .insert({
      tenant_id: tenantId,
      name: body.name?.trim() || "API key",
      key_prefix: prefix,
      key_hash: hash,
      scopes: Array.isArray(body.scopes) && body.scopes.length
        ? body.scopes
        : ["contacts:read", "contacts:write"],
    })
    .select("id, name, key_prefix, scopes, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Raw key returned exactly once — never retrievable again
  return NextResponse.json({ ...data, key: raw });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("tenant_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
