import "server-only";

/** Below this many dollars the Super Admin overview shows a red top-up warning. */
export const OPENROUTER_LOW_USD = 2;

export type OpenRouterBalance = { credits: number; used: number; remaining: number; low: boolean };

/** Prepaid OpenRouter credit left on the account (site chat + AI tools). Cached 10 minutes. */
export async function getOpenRouterBalance(): Promise<OpenRouterBalance | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/credits", {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const { data } = (await res.json()) as { data?: { total_credits?: number; total_usage?: number } };
    const credits = Number(data?.total_credits ?? 0);
    const used = Number(data?.total_usage ?? 0);
    const remaining = Math.max(0, credits - used);
    return { credits, used, remaining, low: remaining < OPENROUTER_LOW_USD };
  } catch {
    return null;
  }
}
