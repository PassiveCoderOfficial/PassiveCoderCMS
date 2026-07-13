import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export interface ApiKeyContext {
  tenantId: string;
  keyId: string;
  scopes: string[];
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Generate a new raw API key. Returned once; only the hash is stored. */
export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = "pc_" + randomBytes(24).toString("hex");
  return { raw, prefix: raw.slice(0, 8), hash: hashApiKey(raw) };
}

/**
 * Authenticate a /api/v1 request via `Authorization: Bearer pc_…`.
 * Returns null when the key is missing, unknown, or revoked.
 */
export async function verifyApiKey(req: Request, requiredScope?: string): Promise<ApiKeyContext | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer pc_")) return null;
  const raw = auth.slice(7);

  const supabase = await createAdminClient();
  const { data: key } = await supabase
    .from("tenant_api_keys")
    .select("id, tenant_id, scopes, revoked_at")
    .eq("key_hash", hashApiKey(raw))
    .maybeSingle();

  if (!key || key.revoked_at) return null;
  if (requiredScope && !key.scopes.includes(requiredScope)) return null;

  // Fire-and-forget usage stamp
  supabase.from("tenant_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id)
    .then(() => {}, () => {});

  return { tenantId: key.tenant_id, keyId: key.id, scopes: key.scopes };
}
