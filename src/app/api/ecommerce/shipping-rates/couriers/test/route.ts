import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { accountFor, testAccount } from "@/lib/couriers";

export async function POST(req: Request) {
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't manage courier accounts." }, { status: 403 });
  const { provider } = await req.json().catch(() => ({}));
  const admin = await createAdminClient();
  const acc = await accountFor(admin, tenantId, null, String(provider));
  if (!acc) return NextResponse.json({ error: "Save the account first" }, { status: 404 });
  return NextResponse.json(await testAccount(admin, acc));
}
