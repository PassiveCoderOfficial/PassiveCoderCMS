import { NextResponse, type NextRequest } from "next/server";
import { DISPLAY_CODES, FALLBACK_RATES, type DisplayCode } from "@/lib/currency/display";

export const dynamic = "force-dynamic";

/** Today's USD rates for the display currencies; refreshed once a day. */
async function rates(): Promise<Record<DisplayCode, number>> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 86400 } });
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (body.result !== "success" || !body.rates) return FALLBACK_RATES;
    const out = { ...FALLBACK_RATES };
    for (const c of DISPLAY_CODES) if (Number(body.rates[c]) > 0) out[c] = Number(body.rates[c]);
    return out;
  } catch {
    return FALLBACK_RATES;
  }
}

/**
 * Visitor country (Vercel edge header) and display rates for the price
 * blocks' currency picker. The country decides the default currency and
 * whether the Bangladesh taka plan is offered on international pages.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { country: req.headers.get("x-vercel-ip-country"), rates: await rates() },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
