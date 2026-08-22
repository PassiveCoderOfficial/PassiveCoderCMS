import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveAgentEditorCaller } from "@/lib/ai-agent/resolve-caller";

export async function POST(req: Request) {
  const caller = await resolveAgentEditorCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { actionId } = body as { actionId?: string };
  if (!actionId) return NextResponse.json({ error: "Missing actionId" }, { status: 400 });

  const admin = await createAdminClient();

  const { data: pending, error: fetchError } = await admin
    .from("agent_pending_actions")
    .select("*")
    .eq("id", actionId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!pending) return NextResponse.json({ error: "Pending action not found" }, { status: 404 });
  if (pending.tenant_id !== caller.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (pending.status !== "pending") {
    return NextResponse.json({ error: `Action is already ${pending.status}` }, { status: 409 });
  }

  await admin
    .from("agent_pending_actions")
    .update({ status: "cancelled", resolved_at: new Date().toISOString(), resolved_by: caller.userId })
    .eq("id", actionId);

  await admin.from("agent_messages").insert({
    conversation_id: pending.conversation_id,
    tenant_id: caller.tenantId,
    role: "system",
    content: `Cancelled: ${pending.human_description}`,
  });
  await admin.from("agent_conversations").update({ updated_at: new Date().toISOString() }).eq("id", pending.conversation_id);

  return NextResponse.json({ ok: true });
}
