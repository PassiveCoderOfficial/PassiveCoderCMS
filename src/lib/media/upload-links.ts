import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
// The bare root domain 307-redirects to www, which breaks script POSTs (curl), so links point at www.
const BASE = ROOT.includes("localhost") ? `http://${ROOT}` : `https://${ROOT.replace(/^www\./, "")}`;

export const UPLOAD_LINK_HOURS = 24;
/** Per-link cap so a leaked link can't fill a site's storage. */
export const UPLOAD_LINK_MAX_FILES = 100;

/** A page where anyone holding the link can drop images into one site's media library for 24 hours. */
export async function createUploadLink(admin: SupabaseClient, tenantId: string, userId: string | null) {
  const token = randomBytes(18).toString("base64url");
  const expires = new Date(Date.now() + UPLOAD_LINK_HOURS * 3600_000);
  const { error } = await admin.from("media_upload_links").insert({ token, tenant_id: tenantId, created_by: userId, expires_at: expires.toISOString() });
  if (error) throw new Error(error.message);
  return { url: `${BASE}/drop/${token}`, expiresAt: expires.toISOString() };
}

export type UploadLink = { token: string; tenant_id: string; uploads: number; expires_at: string; siteName: string };

/** The live link for a token, or null when unknown, expired or used up. */
export async function resolveUploadLink(admin: SupabaseClient, token: string): Promise<UploadLink | null> {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
  const { data } = await admin.from("media_upload_links")
    .select("token, tenant_id, uploads, expires_at, tenants(name)").eq("token", token).maybeSingle();
  if (!data || new Date(data.expires_at as string) < new Date() || (data.uploads as number) >= UPLOAD_LINK_MAX_FILES) return null;
  const t = (Array.isArray(data.tenants) ? data.tenants[0] : data.tenants) as { name: string } | null;
  return { token: data.token as string, tenant_id: data.tenant_id as string, uploads: data.uploads as number, expires_at: data.expires_at as string, siteName: t?.name ?? "this site" };
}
