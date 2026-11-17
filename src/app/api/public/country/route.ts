import { NextResponse, type NextRequest } from "next/server";
import { countryForCode } from "@/lib/pricing/countries";
import { COUNTRY_COOKIE, COUNTRY_COOKIE_MAX_AGE } from "@/lib/pricing/visitor-country";

export const dynamic = "force-dynamic";

/**
 * "Change country" on the global price bar: remembers the visitor's choice
 * in a cookie that beats geo detection. "US" means the international USD
 * list. Anything we do not price separately is refused.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { country?: string };
  const country = countryForCode(body.country);
  if (!country) return NextResponse.json({ error: "Unknown country" }, { status: 400 });
  const res = NextResponse.json({ country: country.code, currency: country.currency });
  res.cookies.set(COUNTRY_COOKIE, country.code, { path: "/", maxAge: COUNTRY_COOKIE_MAX_AGE, sameSite: "lax" });
  return res;
}
