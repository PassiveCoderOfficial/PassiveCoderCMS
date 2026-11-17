import { NextResponse } from "next/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { signState } from "@/lib/analytics/google-oauth-state";
import { bingAuthorizeUrl, bingConfigured } from "@/lib/seo/bing";

/** Sends the owner to Bing's consent screen; the callback lives on the root domain. */
export async function GET() {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });
  if (!bingConfigured()) return NextResponse.json({ error: "Bing isn't configured on this deployment yet." }, { status: 503 });
  return NextResponse.redirect(bingAuthorizeUrl(signState({ tenantId, userId: user.id, ts: Date.now(), ret: "seo" })));
}
