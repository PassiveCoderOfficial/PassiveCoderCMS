import { z } from "zod";
import { completeChat, providerById } from "@/lib/ai/provider";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { installerAccess } from "@/lib/installer/server";
import { EXPLAIN_SYSTEM, explainItems } from "../../../../../selfhost/lib/agent-help.mjs";

/*
 * Web installer: "Explain this". Asks Passive Coder AI for a plain-language
 * explanation of the failed checks.
 *
 * What is sent: check ids, titles and the installer's own English messages
 * (explainItems() keeps only known ids and codes; params other than setting
 * NAMES and counts, such as addresses, are not filled in). Never a setting's
 * value, never the browser's input as free text.
 *
 * Only when PASSIVECODER_AI_KEY is set (it pays for the call). Same gate as the
 * other installer routes: 404 on the hosted platform, refused once a site
 * exists, the setup code when one is set. Rate limited per visitor and overall.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const Body = z.object({
  checks: z.array(z.object({
    id: z.string().max(40),
    code: z.string().max(80),
    params: z.record(z.string(), z.union([z.string().max(400), z.number()])).optional(),
  })).min(1).max(20),
  platform: z.enum(["vercel", "docker", "node"]).optional(),
});

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  // "check": works while the database is still unknown (that is when help is needed).
  const access = await installerAccess(req, "check", { scope: "explain", max: 6 });
  if (!access.ok) return access.response;
  if (rateLimited("setup:explain:all", 60, 60 * 60_000) || rateLimited(`setup:explain-day:${clientIp(req)}`, 20, 24 * 60 * 60_000)) {
    return json({ ok: false, code: "rate_limited" }, 429);
  }

  const provider = providerById("passivecoder");
  if (!provider) return json({ ok: false, code: "ai_not_configured" }, 400);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, code: "bad_request" }, 400);
  const items = explainItems(parsed.data.checks);
  if (!items.length) return json({ ok: false, code: "bad_request" }, 400);

  const where = { vercel: "Vercel + Supabase", docker: "own server (Docker, /opt/passivecoder)", node: "Node.js CLI install (.env.local)" }[parsed.data.platform ?? "node"];
  const user = [
    `Install type: ${where}.`,
    "Failed checks:",
    ...items.map((it, i) => `${i + 1}. ${it.title} (${it.id}): ${it.message}`),
  ].join("\n");

  try {
    const res = await completeChat(provider, {
      system: EXPLAIN_SYSTEM,
      user,
      maxTokens: 600,
      temperature: 0.2,
      title: "Passive Coder CMS installer",
      meta: { use: "assistant" },
    });
    const text = (res.content ?? "").trim();
    if (!text) return json({ ok: false, code: "ai_unreachable" }, 502);
    return json({ ok: true, text: text.slice(0, 4000) });
  } catch (e) {
    // The provider's message can name the HTTP status; it never holds our key.
    const status = /\((\d{3})\)/.exec(e instanceof Error ? e.message : "")?.[1];
    return json({ ok: false, code: status === "401" || status === "403" ? "ai_key_invalid" : status === "402" ? "ai_no_credits" : "ai_unreachable" }, 502);
  }
}
