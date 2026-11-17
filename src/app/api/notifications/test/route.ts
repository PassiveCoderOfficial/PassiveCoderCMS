import { NextResponse } from "next/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { pushToUser } from "@/lib/push/web-push";

/** Sends one test notification to the signed-in person's own devices. */
export async function POST() {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!user || !tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sent } = await pushToUser(tenantId, user.id, { title: "Notifications are working", body: "You will hear about new orders, enquiries and payments here.", url: "/dashboard", tag: "test" });
  return sent ? NextResponse.json({ ok: true, sent }) : NextResponse.json({ error: "No device received it" }, { status: 502 });
}
