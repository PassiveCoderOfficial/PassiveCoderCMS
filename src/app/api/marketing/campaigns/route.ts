import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("campaigns")
    .select("*").eq("tenant_id", tenantId)
    .order("created_at", { ascending: false }).limit(100);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
  if (channel === "whatsapp") {
    return NextResponse.json({ error: "WhatsApp campaigns are coming soon" }, { status: 400 });
  }

  const { data, error } = await supabase.from("campaigns")
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      channel,
      subject: body.subject?.trim() || null,
      body: body.body ?? "",
      audience: body.audience && typeof body.audience === "object" ? body.audience : { all: true },
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
