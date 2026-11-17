import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveAgentCaller } from "@/lib/ai-agent/resolve-caller";

export async function GET(req: Request) {
  const caller = await resolveAgentCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("agent_conversations")
    .select("id, title, updated_at")
    .eq("tenant_id", caller.tenantId)
    .eq("user_id", caller.userId)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversations: data ?? [] });
}
