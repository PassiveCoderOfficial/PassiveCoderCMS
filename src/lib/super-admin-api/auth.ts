import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth/api-caller";
import { createAdminClient } from "@/lib/supabase/server";
import { isPanelAdmin } from "@/lib/super-admin";

/** Super-admin API guard: the signed-in SA user plus a service-role client, or an error response. */
export async function saAuthed() {
  const user = await apiUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if (!(await isPanelAdmin(user.id))) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  return { admin: await createAdminClient(), user } as const;
}

export async function usdToBdtRate(admin: Awaited<ReturnType<typeof createAdminClient>>): Promise<number> {
  const { data } = await admin.from("platform_settings").select("usd_to_bdt_rate").eq("id", 1).maybeSingle();
  return Number((data as { usd_to_bdt_rate?: number } | null)?.usd_to_bdt_rate) || 125;
}
