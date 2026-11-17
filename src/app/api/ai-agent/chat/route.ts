import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveAgentCaller } from "@/lib/ai-agent/resolve-caller";
import { runAgentTurn, finishReadOnlyTurn, type AgentHistoryMessage, type PriorRead } from "@/lib/ai-agent/orchestrate";
import { describeAnyPendingAction as describePendingAction } from "@/lib/ai-agent/all-tools";
import { AiCoderError } from "@/lib/aicoder/generate";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";
import { expandPartialSave } from "@/lib/ai-agent/patch-save";

// Two model calls plus a tool run per turn — well past the default function timeout.
export const maxDuration = 300;

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
  let reservation: CreditReservation;
  try {
    reservation = await reserveCredits(caller.tenantId, "assistant", { userId: caller.userId });
  } catch (err) {
    if (err instanceof AiCreditsError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.code === "no_credits" ? 402 : 429 });
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
      await refundCredits(reservation).catch(() => {});
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    const title = message.trim().slice(0, 60);
    const { data: created, error } = await admin
      .from("agent_conversations")
      .insert({ tenant_id: caller.tenantId, user_id: caller.userId, title })
      .select("id")
      .single();
    if (error) {
      await refundCredits(reservation).catch(() => {});
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
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
    let turn = await runAgentTurn({ contextKind: scope, pageId, history, message });

    // Resolve reads (bounded inside finishReadOnlyTurn) until the turn ends in
    // a reply or a write proposal.
    let prior: PriorRead[] = [];
    while (turn.kind === "read") {
      const res = await finishReadOnlyTurn({
        contextKind: scope,
        pageId,
        history,
        message,
        tool: turn.tool,
        args: turn.args,
        ctx: { tenantId: caller.tenantId, userId: caller.userId, supabase: admin },
        prior,
      });
      prior = res.reads;
      turn = res;
    }

    if (turn.kind === "propose") {
      if (turn.tool.name === "save_page_blocks") {
        turn = { ...turn, args: await expandPartialSave(turn.args, admin, caller.tenantId) };
      }
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

    const finalReply = turn.reply;

    await admin.from("agent_messages").insert({
      conversation_id: convoId,
      tenant_id: caller.tenantId,
      role: "assistant",
      content: finalReply,
    });
    await admin.from("agent_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);

    return NextResponse.json({ conversationId: convoId, reply: finalReply, pendingActions: [] });
  } catch (err) {
    // A turn the model could not answer costs nothing.
    await refundCredits(reservation).catch(() => {});
    if (err instanceof AiCoderError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "no_api_key" ? 503 : 502 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Agent failed" }, { status: 500 });
  }
}
