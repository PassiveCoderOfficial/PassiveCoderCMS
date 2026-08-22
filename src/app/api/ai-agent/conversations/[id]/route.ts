import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveAgentCaller } from "@/lib/ai-agent/resolve-caller";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await resolveAgentCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  const { data: convo, error: convoError } = await admin
    .from("agent_conversations")
    .select("id, tenant_id, title, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (convoError) return NextResponse.json({ error: convoError.message }, { status: 500 });
  if (!convo || convo.tenant_id !== caller.tenantId) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const [{ data: messages, error: messagesError }, { data: pendingActions, error: pendingError }] = await Promise.all([
    admin.from("agent_messages").select("id, role, content, created_at").eq("conversation_id", id).order("created_at", { ascending: true }),
    admin.from("agent_pending_actions").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
  ]);
  if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 });
  if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 500 });

  return NextResponse.json({ conversation: convo, messages: messages ?? [], pendingActions: pendingActions ?? [] });
}
