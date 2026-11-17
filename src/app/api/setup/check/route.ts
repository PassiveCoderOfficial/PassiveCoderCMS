import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { loadLicence } from "@/lib/licence";
import { gatherFacts, hasWritableDisk, installerAccess, installPlatform, runChecks, factsSiteExists } from "@/lib/installer/server";

/*
 * Web installer, step 0: the system check. Read-only. Answers with the list
 * of results (names, counts and host names; never a setting's value) and
 * what the installer can do next. See lib/installer/server.ts for who may
 * call it.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({ origin: z.string().max(300).optional() });

function cleanOrigin(input: string | undefined): string | null {
  try {
    const u = new URL(input ?? "");
    return /^https?:$/.test(u.protocol) ? u.origin : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // The full look first: it also tells us whether a site exists, so the gate
  // does not need a second trip to the database.
  const pre = await installerAccess(req, "check", { scope: "check", max: 60, known: null });
  if (!pre.ok) return pre.response;

  const body = Body.safeParse(await req.json().catch(() => ({})));
  const facts = await gatherFacts(cleanOrigin(body.success ? body.data.origin : undefined));
  const exists = factsSiteExists(facts);
  const access = await installerAccess(req, "check", { scope: "check-2", max: 120, known: exists });
  if (!access.ok) return access.response;

  const { results, summary } = runChecks(facts);

  // Ready-made templates in the database, if this copy has any.
  let templates: { slug: string; name: string; category: string | null }[] = [];
  if (summary.ready) {
    try {
      const admin = await createAdminClient();
      const { data } = await admin.from("templates").select("slug,name,category").not("owner_id", "is", null).eq("status", "published").order("name").limit(30);
      templates = (data ?? []) as typeof templates;
    } catch { /* the starter site is always there */ }
  }

  return Response.json({
    platform: installPlatform(),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "",
    needsToken: !!process.env.SETUP_TOKEN?.trim(),
    results,
    summary,
    canSave: hasWritableDisk(),
    has: {
      email: !!(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim()),
      smtp: !!process.env.SMTP_HOST?.trim(),
      emailFrom: !!process.env.EMAIL_FROM?.trim(),
      ai: !!(process.env.PASSIVECODER_AI_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)?.trim(),
      licence: loadLicence().state === "valid",
      // "Explain this" on failed checks asks Passive Coder AI (/api/setup/explain).
      pcAi: !!process.env.PASSIVECODER_AI_KEY?.trim(),
    },
    templates,
  }, { headers: { "Cache-Control": "no-store" } });
}
