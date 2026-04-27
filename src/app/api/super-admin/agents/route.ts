import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, action, status, commission_rate } = await req.json() as {
    agentId: string;
    action: "status" | "commission";
    status?: string;
    commission_rate?: number;
  };

  if (!agentId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = await createAdminClient();

  if (action === "status") {
    if (!["active", "suspended", "pending"].includes(status ?? "")) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const { error } = await supabase.from("agents").update({ status, updated_at: new Date().toISOString() }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "commission") {
    if (typeof commission_rate !== "number" || commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({ error: "Invalid commission rate" }, { status: 400 });
    }
    const { error } = await supabase.from("agents").update({ commission_rate, updated_at: new Date().toISOString() }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
