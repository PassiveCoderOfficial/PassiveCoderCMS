import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { getSiteFacts } from "@/lib/seo/site-facts";
import { rootTenantId } from "@/lib/site/root-builder";
import { ROOT_TENANT_SLUG } from "@/lib/flags";
import { DEFAULT_GREETING, siteChatPlanAllowed } from "./usage";
import { richPlan } from "@/lib/experts/profile-content";
import { parseIntakeSettings } from "./intake-rules";

export type SiteChatConfig = {
  greeting: string; chips: string[]; siteName: string; logoUrl: string | null;
  /** AI answers (Pro/Biz + switched on by super admin). Off = live chat only. */
  ai: boolean;
  replyMinutes: number;
  /** Job intake (photos, site visit), only when the site opted in and the AI is on. */
  intake: { word: string } | null;
  /** How the chat invites visitors: a callout by the button (default), open the window, or nothing. */
  prompt: ChatPrompt;
};

export type ChatPrompt = { mode: "bubble" | "open" | "off"; text: string | null };

export function parseChatPrompt(v: unknown): ChatPrompt {
  const o = (v && typeof v === "object" ? v : {}) as { mode?: unknown; text?: unknown };
  const mode = o.mode === "open" || o.mode === "off" ? o.mode : "bubble";
  const text = typeof o.text === "string" && o.text.trim() ? o.text.trim().slice(0, 80) : null;
  return { mode, text };
}

/** Read on its own so the chat keeps working where the column is not there yet. */
async function chatPrompt(tenantId: string): Promise<ChatPrompt> {
  const admin = await createAdminClient();
  const { data, error } = await admin.from("tenants").select("site_chat_prompt").eq("id", tenantId).maybeSingle();
  return parseChatPrompt(error ? null : data?.site_chat_prompt);
}

export type SiteChatFlags = { widget: boolean; ai: boolean; plan: string; replyMinutes: number; greeting: string | null; name: string; root: boolean; intake: { word: string } | null };

/** Chat flags for a tenant. The widget shows when the owner switched chat on, or the AI is on. */
export async function siteChatFlags(tenantId: string): Promise<SiteChatFlags | null> {
  const admin = await createAdminClient();
  const { data: t } = await admin.from("tenants")
    .select("name, slug, plan, site_chat_enabled, site_chat_widget, site_chat_greeting, site_chat_reply_minutes, site_chat_intake").eq("id", tenantId).maybeSingle();
  if (!t) return null;
  // The platform's own root site counts as eligible whatever its plan row says.
  const ai = !!t.site_chat_enabled && (siteChatPlanAllowed(t.plan as string) || t.slug === ROOT_TENANT_SLUG);
  const intake = ai ? parseIntakeSettings(t.site_chat_intake) : null;
  return {
    intake: intake ? { word: intake.word } : null,
    widget: !!t.site_chat_widget || ai, ai, plan: String(t.plan ?? ""),
    replyMinutes: Number(t.site_chat_reply_minutes ?? 3) || 3, greeting: (t.site_chat_greeting as string | null) ?? null, name: String(t.name ?? ""),
    root: t.slug === ROOT_TENANT_SLUG,
  };
}

/** Site name + logo from Site Identity (what the header shows). */
export async function siteIdentityName(tenantId: string): Promise<{ name: string | null; logo: string | null }> {
  const admin = await createAdminClient();
  const { data } = await admin.from("site_identity").select("site_name, logo_url").eq("tenant_id", tenantId).maybeSingle();
  return { name: (data?.site_name as string | null)?.trim() || null, logo: (data?.logo_url as string | null) || null };
}

/** Widget config for the live site, or null when chat is off (nothing rendered, no client request). */
export const getSiteChatConfig = cache(async (tenantId: string | null): Promise<SiteChatConfig | null> => {
  if (!tenantId) return null;
  const f = await siteChatFlags(tenantId);
  if (!f?.widget) return null;
  const facts = await getSiteFacts(tenantId).catch(() => null);
  const id = await siteIdentityName(tenantId);
  return {
    greeting: f.greeting?.trim() || DEFAULT_GREETING,
    chips: (facts?.services ?? []).slice(0, 3).map((s) => s.name.slice(0, 40)),
    // The name the site's own header shows wins: a business profile can hold a
    // stale prefill (the root site once kept a café template's name in it).
    siteName: id.name ?? facts?.name ?? f.name,
    logoUrl: id.logo ?? facts?.logo ?? null,
    ai: f.ai,
    replyMinutes: f.replyMinutes,
    intake: f.intake,
    prompt: await chatPrompt(tenantId),
  };
});

/**
 * Experts directory (Phase 6): the tenant whose site chat a profile's
 * "Message" button opens. Only a listed expert linked to a live Pro/Biz site
 * (same rule as booking and services) with the chat widget on; else null.
 */
export async function expertChatTenant(slug: string | null | undefined): Promise<string | null> {
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const admin = await createAdminClient();
  const { data: e } = await admin.from("experts").select("tenant_id").eq("slug", slug).eq("listed", true).maybeSingle();
  const tenantId = (e?.tenant_id as string | null | undefined) ?? null;
  if (!tenantId) return null;
  const { data: t } = await admin.from("tenants").select("plan, status").eq("id", tenantId).maybeSingle();
  if (!t || !richPlan(t.plan as string, t.status as string)) return null;
  const f = await siteChatFlags(tenantId);
  return f?.widget ? tenantId : null;
}

const rootHosts = () => {
  const r = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0];
  return [r, `www.${r}`];
};

/**
 * Tenant for a public chat request: the proxy's x-tenant-id on tenant hosts.
 * On the platform's own domain the header is not set by the proxy (and
 * could be forged), so the root site tenant is used instead.
 */
export async function chatTenantFromRequest(req: Request): Promise<string | null> {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (rootHosts().includes(host)) return rootTenantId();
  // Experts directory: the chat on a profile is the expert's own site chat,
  // found from ?expert=<slug> (never from a header), Pro/Biz with chat on only.
  if (host.startsWith("experts.")) return expertChatTenant(new URL(req.url).searchParams.get("expert"));
  return req.headers.get("x-tenant-id");
}
