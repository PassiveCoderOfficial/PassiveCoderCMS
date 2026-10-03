import "server-only";
import { createHash } from "node:crypto";

/** Platform-wide IndexNow key (32 hex), stable across deploys. Served at
 *  /indexnow-key.txt on every site so each host can prove ownership. */
export function indexNowKey(): string {
  const seed = process.env.INDEXNOW_KEY || `indexnow:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? "passivecoder"}`;
  return /^[0-9a-f]{32}$/.test(seed) ? seed : createHash("sha256").update(seed).digest("hex").slice(0, 32);
}

/** Tell IndexNow engines (Bing, Yandex, Seznam, Naver) these URLs changed. */
export async function submitIndexNow(host: string, urls: string[]): Promise<{ ok: boolean; status: number }> {
  if (!urls.length) return { ok: true, status: 200 };
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: indexNowKey(), keyLocation: `https://${host}/indexnow-key.txt`, urlList: urls.slice(0, 10000) }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  return { ok: !!res && res.status < 300, status: res?.status ?? 0 };
}
