import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action } = await req.json() as { userId: string; action: "grant" | "revoke" };
  const supabase = await createAdminClient();

  if (action === "grant") {
    const { error } = await supabase.from("super_admins").insert({ user_id: userId, granted_by: caller.id });
    if (error && error.code !== "23505") { // ignore duplicate
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("super_admins").delete().eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
