import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentUserId, vendorIdForUser } from "@/lib/marketplace-ecom/chat";

/** Unread totals for header badges: as a buyer, and as a seller if the user
 *  runs a shop here. Anonymous visitors get zeros, not an error. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  const userId = await currentUserId();
  if (!tenantId || !userId) return NextResponse.json({ signed_in: false, buyer: 0, vendor: 0 });

  const admin = await createAdminClient();
  const vid = await vendorIdForUser(tenantId, userId);
  const [{ data: b }, v] = await Promise.all([
    admin.from("chat_conversations").select("buyer_unread").eq("tenant_id", tenantId).eq("buyer_id", userId),
    vid
      ? admin.from("chat_conversations").select("vendor_unread").eq("vendor_id", vid)
      : Promise.resolve({ data: [] as { vendor_unread: number }[] }),
  ]);
  const sum = (rows: Record<string, number>[] | null, k: string) => (rows ?? []).reduce((a, r) => a + (r[k] ?? 0), 0);
  return NextResponse.json({
    signed_in: true,
    is_seller: Boolean(vid),
    buyer: sum(b as Record<string, number>[], "buyer_unread"),
    vendor: sum(v.data as Record<string, number>[], "vendor_unread"),
  });
}
