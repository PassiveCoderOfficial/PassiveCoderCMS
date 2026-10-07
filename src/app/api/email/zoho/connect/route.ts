import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { authorizeUrl, signState, zohoConfigured } from "@/lib/email/zoho";

/** Start "Connect Zoho": send the owner to Zoho to approve access to their Zoho Mail organisation. */
export async function GET(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  if (!zohoConfigured()) return NextResponse.json({ error: "Zoho isn't set up on the platform yet." }, { status: 503 });
  // Come back to the same dashboard host (the site's subdomain) after Zoho.
  const back = new URL("/dashboard/settings/email", req.url).toString();
  return NextResponse.redirect(authorizeUrl(signState(a.tenantId, a.userId, back)));
}
