import "server-only";
import type { createAdminClient } from "@/lib/supabase/server";
type SupabaseClient = Awaited<ReturnType<typeof createAdminClient>>;

/**
 * Fair use for the visitor AI chat (owner decision 2026-10-25). The monthly
 * allowance and top-ups moved to AI Credits (lib/ai/credits.ts): one credit
 * per conversation, from the site's one balance.
 */
export const SITE_CHAT_LIMITS = {
  messagesPerConversation: 12,
  conversationsPerDay: 50,
  maxMessageChars: 800,
} as const;

/** AI chat is on every plan (2026-10-26). */
export const siteChatPlanAllowed = (_plan?: string | null) => true;
export const DEFAULT_GREETING = "Hi! How can we help you today?";

const monthStart = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);

export type SiteChatUsage = {
  month: string;
  monthConversations: number;
  monthCostUsd: number;
  monthLeads: number;
};

/** Activity for one site this month, for the team's stats. Not a limit: see AI Credits. */
export async function siteChatUsage(admin: SupabaseClient, tenantId: string): Promise<SiteChatUsage> {
  const month = monthStart();
  const { data: cur } = await admin.from("site_chat_monthly").select("month, conversations, cost_usd, leads").eq("tenant_id", tenantId).eq("month", month).maybeSingle();
  return {
    month,
    monthConversations: Number(cur?.conversations ?? 0),
    monthCostUsd: Number(cur?.cost_usd ?? 0),
    monthLeads: Number(cur?.leads ?? 0),
  };
}

/** AI-answered conversations started today (UTC). */
export async function siteChatToday(admin: SupabaseClient, tenantId: string): Promise<number> {
  const d = new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
  const { count } = await admin.from("site_chat_conversations").select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId).eq("ai_answered", true).gte("started_at", start);
  return count ?? 0;
}

/** USD cost from OpenRouter usage; falls back to list token prices. */
export function chatCostUsd(u: { cost?: number; prompt_tokens?: number; completion_tokens?: number; cached?: number }): number {
  if (typeof u.cost === "number" && u.cost >= 0) return u.cost;
  const cached = u.cached ?? 0;
  const input = Math.max(0, (u.prompt_tokens ?? 0) - cached);
  return (input * 0.10 + (u.completion_tokens ?? 0) * 0.50 + cached * 0.01) / 1_000_000;
}
