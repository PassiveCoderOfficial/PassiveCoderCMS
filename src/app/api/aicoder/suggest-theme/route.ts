import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { suggestTheme, AiCoderError } from "@/lib/aicoder/generate";
import { businessFactsSchema } from "@/lib/aicoder/brief";
import { applyThemeSuggestion } from "@/lib/aicoder/apply-theme";

/**
 * Suggests a site-wide palette and type pairing from the brief's design
 * direction, and — only on an explicit second call with `apply` — writes it.
 *
 * Theme is site-wide, so this is kept out of the page-generation flow entirely.
 * Restyling every existing page as a side effect of generating one new page
 * would be a genuinely destructive surprise, so the suggestion is surfaced on
 * its own and applied only when the user says so.
 *
 * Applying creates a NEW theme row rather than mutating the active one. The
 * previous theme stays intact and selectable, which is the whole undo story for
 * an operation that has no page-snapshot equivalent.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await requireModule(tenantId, "ai_coder")) {
    return NextResponse.json({ error: "AiCoder isn't included in this site's plan" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { facts: rawFacts, apply, theme: rawTheme } = body as {
    facts?: unknown;
    apply?: boolean;
    theme?: Record<string, string>;
  };

  // --- Apply path: persist a previously suggested theme -------------------
  if (apply) {
    const result = await applyThemeSuggestion(tenantId, rawTheme as Record<string, string> | undefined);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, themeId: result.themeId });
  }

  // --- Suggest path -------------------------------------------------------
  const factsResult = businessFactsSchema.safeParse(rawFacts);
  if (!factsResult.success) {
    return NextResponse.json({ error: "Invalid business facts — re-plan the page first." }, { status: 400 });
  }

  try {
    const theme = await suggestTheme(factsResult.data);
    return NextResponse.json({ theme });
  } catch (err) {
    if (err instanceof AiCoderError) {
      const status = err.code === "no_api_key" ? 503 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't suggest a theme" },
      { status: 500 },
    );
  }
}
