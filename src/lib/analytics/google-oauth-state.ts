import crypto from "crypto";

export interface GaOAuthState {
  tenantId: string;
  userId: string;
  ts: number;
}

/** HMAC-signed OAuth state shared between connect/route.ts (signs) and
 *  callback/route.ts (verifies) — split into its own module because a
 *  Next.js route file may only export HTTP method handlers; any other
 *  export fails the build ("not a valid Route export field"). */
export function signState(payload: GaOAuthState): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-insecure-secret";
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** Verifies the state wasn't forged and hasn't expired (10 minutes,
 *  generous for a consent-screen round trip but not indefinitely
 *  replayable). */
export function verifyState(state: string): GaOAuthState | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-insecure-secret";
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GaOAuthState;
    if (Date.now() - payload.ts > 10 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
