import { indexNowKey } from "@/lib/seo/indexnow";

/** IndexNow ownership key file, same on every site (see lib/seo/indexnow.ts). */
export function GET() {
  return new Response(indexNowKey(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
