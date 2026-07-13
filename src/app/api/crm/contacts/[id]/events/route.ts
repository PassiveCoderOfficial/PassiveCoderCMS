import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const type = ["note", "call", "email", "whatsapp"].includes(body.type) ? body.type : "note";
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.from("contact_events")
    .insert({
      tenant_id: tenantId,
      contact_id: id,
      type,
      title: body.title?.trim() || (type === "note" ? "Note" : type),
      body: body.body?.trim() || null,
      actor_user_id: user?.id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
