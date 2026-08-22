import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveAgentCaller } from "@/lib/ai-agent/resolve-caller";
import { runAgentTurn, finishReadOnlyTurn, type AgentHistoryMessage } from "@/lib/ai-agent/orchestrate";
import { describePendingAction } from "@/lib/ai-agent/tools";
import { AiCoderError } from "@/lib/aicoder/generate";
import { AiCoderQuotaError } from "@/lib/aicoder/quota";
import { reserveChatTurn } from "@/lib/ai-agent/chat-quota";

export async function POST(req: Request) {
  const caller = await resolveAgentCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { conversationId, message, context } = body as {
    conversationId?: string;
    message?: string;
    context?: { scope?: "general" | "editor"; pageId?: string };
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }
  const scope: "general" | "editor" = context?.scope === "editor" ? "editor" : "general";
  const pageId = context?.pageId;

  // Meter BEFORE any model call — a denied turn must never cost tokens, and
  // must not leave a half-written conversation behind either.
  try {
    await reserveChatTurn(caller.tenantId);
  } catch (err) {
    if (err instanceof AiCoderQuotaError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }

  const admin = await createAdminClient();

  let convoId = conversationId;
  if (convoId) {
    const { data: convo } = await admin
      .from("agent_conversations")
      .select("id, tenant_id")
      .eq("id", convoId)
      .maybeSingle();
    if (!convo || convo.tenant_id !== caller.tenantId) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    const title = message.trim().slice(0, 60);
    const { data: created, error } = await admin
      .from("agent_conversations")
      .insert({ tenant_id: caller.tenantId, user_id: caller.userId, title })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    convoId = created.id;
  }

  const { data: historyRows } = await admin
    .from("agent_messages")
    .select("role, content")
    .eq("conversation_id", convoId)
    .order("created_at", { ascending: true })
    .limit(40);
  const history: AgentHistoryMessage[] = (historyRows ?? []).map(r => ({
    role: r.role as AgentHistoryMessage["role"],
    content: r.content,
  }));

  await admin.from("agent_messages").insert({
    conversation_id: convoId,
    tenant_id: caller.tenantId,
    role: "user",
    content: message,
  });

  try {
    const turn = await runAgentTurn({ contextKind: scope, pageId, history, message });

    if (turn.kind === "propose") {
      const humanDescription = describePendingAction(turn.tool.name, turn.args);
      const { data: pending, error: pendingError } = await admin
        .from("agent_pending_actions")
        .insert({
          conversation_id: convoId,
          tenant_id: caller.tenantId,
          tool_name: turn.tool.name,
          args: turn.args,
          human_description: humanDescription,
        })
        .select("*")
        .single();
      if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 500 });

      const replyText = `${turn.reply}\n\n${humanDescription} — confirm to proceed.`;
      await admin.from("agent_messages").insert({
        conversation_id: convoId,
        tenant_id: caller.tenantId,
        role: "assistant",
        content: replyText,
      });

      await admin.from("agent_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);

      return NextResponse.json({
        conversationId: convoId,
        reply: replyText,
        pendingActions: [pending],
      });
    }

    let finalReply = turn.reply;
    if (turn.kind === "read") {
      finalReply = await finishReadOnlyTurn({
        contextKind: scope,
        pageId,
        history,
        message,
        tool: turn.tool,
        args: turn.args,
        ctx: { tenantId: caller.tenantId, userId: caller.userId, supabase: admin },
      });
    }

    await admin.from("agent_messages").insert({
      conversation_id: convoId,
      tenant_id: caller.tenantId,
      role: "assistant",
      content: finalReply,
    });
    await admin.from("agent_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);

    return NextResponse.json({ conversationId: convoId, reply: finalReply, pendingActions: [] });
  } catch (err) {
    if (err instanceof AiCoderError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "no_api_key" ? 503 : 502 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Agent failed" }, { status: 500 });
  }
}
