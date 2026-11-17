import { NextRequest, NextResponse } from "next/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { createAdminClient } from "@/lib/supabase/server";
import { invalidateSiteCache } from "@/lib/supabase/public-cache";
import { parseChatPrompt, siteChatFlags } from "@/lib/site-chat/config";
import { parseHours } from "@/lib/site-chat/hours";
import { DEFAULT_GREETING, siteChatPlanAllowed, siteChatUsage } from "@/lib/site-chat/usage";
import { getCreditStatus } from "@/lib/ai/credits";
import { DEFAULT_VISIT_WORD, cleanWord } from "@/lib/site-chat/intake-rules";

/** Owner chat settings: widget on/off, greeting, reply wait, job intake; AI status is read-only (super admin switches it). */
export async function GET(req: NextRequest) {
  const caller = await getApiCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = caller.tenantId;
  const admin = await createAdminClient();
  const [{ data: t }, usage, flags, credits, { data: booking }, { data: contact }] = await Promise.all([
    admin.from("tenants").select("plan, site_chat_enabled, site_chat_widget, site_chat_greeting, site_chat_reply_minutes, site_chat_hours, site_chat_intake").eq("id", tenantId).maybeSingle(),
    siteChatUsage(admin, tenantId),
    siteChatFlags(tenantId),
    getCreditStatus(tenantId),
    admin.from("booking_settings").select("enabled, confirmation_mode").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("contact_details").select("phone, whatsapp").eq("tenant_id", tenantId).order("is_primary", { ascending: false }).order("sort_order", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const intake = (t?.site_chat_intake ?? null) as { enabled?: boolean; word?: string } | null;
  const { data: p, error: pErr } = await admin.from("tenants").select("site_chat_prompt").eq("id", tenantId).maybeSingle();
  return NextResponse.json({
    prompt: parseChatPrompt(pErr ? null : p?.site_chat_prompt),
    widget: !!t?.site_chat_widget,
    // Same rule the visitor side uses (the root site counts as eligible on any plan).
    aiEnabled: !!flags?.ai,
    hours: parseHours(t?.site_chat_hours),
    planAllowed: siteChatPlanAllowed(t?.plan as string),
    greeting: (t?.site_chat_greeting as string | null) ?? "",
    replyMinutes: Number(t?.site_chat_reply_minutes ?? 3),
    defaultGreeting: DEFAULT_GREETING,
    // included / topupBalance: only for app builds from before AI Credits.
    usage: { ...usage, included: credits?.unlimited ? 1_000_000 : credits?.total ?? 0, topupBalance: 0 },
    credits,
    intake: {
      enabled: intake?.enabled === true, word: intake?.word ?? DEFAULT_VISIT_WORD,
      bookingOn: !!booking?.enabled, autoConfirm: booking?.confirmation_mode === "auto", hasWhatsapp: !!(contact?.whatsapp || contact?.phone),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const caller = await getApiCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role && !["owner", "admin", "editor"].includes(String(caller.role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tenantId = caller.tenantId;
  const body = (await req.json().catch(() => ({}))) as { greeting?: unknown; widget?: unknown; replyMinutes?: unknown; hours?: unknown; aiEnabled?: unknown; intake?: unknown; prompt?: unknown };
  const patch: Record<string, unknown> = {};
  if (typeof body.greeting === "string") patch.site_chat_greeting = body.greeting.trim().slice(0, 200) || null;
  if (typeof body.widget === "boolean") patch.site_chat_widget = body.widget;
  // The owner switches the AI assistant on or off (on by default, every plan).
  if (typeof body.aiEnabled === "boolean") patch.site_chat_enabled = body.aiEnabled;
  if (typeof body.replyMinutes === "number") patch.site_chat_reply_minutes = Math.min(60, Math.max(1, Math.round(body.replyMinutes)));
  if (body.hours === null) patch.site_chat_hours = null;
  else if (body.hours !== undefined) {
    const h = parseHours(body.hours);
    if (!h) return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
    patch.site_chat_hours = h;
  }
  if (body.intake && typeof body.intake === "object") {
    const i = body.intake as { enabled?: unknown; word?: unknown };
    patch.site_chat_intake = { enabled: i.enabled === true, word: cleanWord(i.word) };
  }
  if (body.prompt && typeof body.prompt === "object") patch.site_chat_prompt = parseChatPrompt(body.prompt);
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  const admin = await createAdminClient();
  const { error } = await admin.from("tenants").update(patch).eq("id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateSiteCache(tenantId);
  return NextResponse.json({ ok: true });
}
