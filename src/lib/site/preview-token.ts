import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { appSecret } from "@/lib/app-secret";

/**
 * Signed, short-lived links that show a page's unpublished draft (or a page
 * that isn't published yet) on the real site, for the mobile app's preview
 * WebView. The token names one page and expires; it grants nothing else.
 * Format: <pageId>.<expiresUnix>.<hmac>
 */

const TTL_S = 30 * 60;

function secret(): string {
  return process.env.PAGE_PREVIEW_SECRET || appSecret();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`page-preview:${payload}`).digest("base64url");
}

export function createPreviewToken(pageId: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + TTL_S;
  return `${pageId}.${exp}.${sign(`${pageId}.${exp}`)}`;
}

/** Page id the token was issued for, or null when invalid/expired. */
export function verifyPreviewToken(token: string | undefined | null, now = Date.now()): string | null {
  if (!token || !secret()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [pageId, expRaw, mac] = parts;
  const exp = Number(expRaw);
  if (!pageId || !Number.isFinite(exp) || exp * 1000 < now) return null;
  const expected = Buffer.from(sign(`${pageId}.${exp}`));
  const got = Buffer.from(mac);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  return pageId;
}

/**
 * The page to preview for this request, with its draft blocks in place, or
 * null (no/invalid token, or the token is for another site/address).
 */
export async function loadPreviewPage(tenantId: string | null, pageSlug: string, token: string | undefined | null) {
  const pageId = verifyPreviewToken(token);
  if (!pageId || !tenantId) return null;
  const admin = await createAdminClient();
  const { data } = await admin.from("pages").select("*").eq("id", pageId).eq("tenant_id", tenantId).eq("slug", pageSlug)
    .is("deleted_at", null).maybeSingle();
  if (!data) return null;
  return { ...data, blocks: data.draft_blocks ?? data.blocks };
}
