import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { listPublicVouchers } from "@/lib/marketplace-ecom/pricing";

/** Public vouchers: platform-wide plus those of the given sellers
 *  (`?vendors=id,id`). `?vendor=all` returns every live public voucher. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ vouchers: [] });
  const sp = new URL(req.url).searchParams;
  const ids = (sp.get("vendors") ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/.test(x));
  const admin = await createAdminClient();
  const vouchers = await listPublicVouchers(admin, tenantId, sp.get("vendor") === "all" ? undefined : ids);
  return NextResponse.json({ vouchers });
}
