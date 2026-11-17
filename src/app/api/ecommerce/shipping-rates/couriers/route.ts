import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { requestOrigin } from "@/lib/couriers/fulfil";
import { CourierError, deleteAccount, listAccounts, publicAccount, saveAccount, testAccount, webhookUrls } from "@/lib/couriers";

/** Platform courier accounts (vendor_id null): the store admin's own
 *  Steadfast / Pathao logins that sellers without one book through. */
async function ctx() {
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  // Secrets live here, so even reading needs write access to the site.
  if (!(await canWriteSite(tenantId))) return { error: NextResponse.json({ error: "Your role can't manage courier accounts." }, { status: 403 }) };
  return { tenantId, admin: await createAdminClient() };
}

export async function GET(req: Request) {
  const c = await ctx();
  if ("error" in c) return c.error;
  const { platform } = await listAccounts(c.admin, c.tenantId, null);
  return NextResponse.json({ own: platform.map(publicAccount), platform: [], webhooks: webhookUrls(requestOrigin(req)) });
}

export async function POST(req: Request) {
  const c = await ctx();
  if ("error" in c) return c.error;
  const body = await req.json().catch(() => ({}));
  try {
    const saved = await saveAccount(c.admin, c.tenantId, null, body);
    const test = await testAccount(c.admin, saved);
    const { platform } = await listAccounts(c.admin, c.tenantId, null);
    return NextResponse.json({ account: publicAccount(platform.find((a) => a.id === saved.id) ?? saved), test });
  } catch (e) {
    const status = e instanceof CourierError ? (e.status === 401 ? 400 : e.status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save" }, { status });
  }
}

export async function DELETE(req: Request) {
  const c = await ctx();
  if ("error" in c) return c.error;
  const provider = new URL(req.url).searchParams.get("provider") ?? "";
  if (!["steadfast", "pathao"].includes(provider)) return NextResponse.json({ error: "Unknown courier" }, { status: 400 });
  await deleteAccount(c.admin, c.tenantId, null, provider);
  return NextResponse.json({ ok: true });
}
