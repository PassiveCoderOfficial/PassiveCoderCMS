import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth/api-caller";
import { cancelDeletion, deletionStatus, requestDeletion } from "@/lib/account/deletion";

/**
 * Account deletion for the signed-in user (web cookie or app Bearer).
 * GET    -> { blockers, pending, needs_password, grace_days }
 * POST   { password? | confirm_email?, reason?, source? } -> schedules deletion
 * DELETE -> cancels a pending deletion
 */
export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await deletionStatus(user), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const res = await requestDeletion(user, {
    password: typeof body.password === "string" ? body.password : undefined,
    confirm_email: typeof body.confirm_email === "string" ? body.confirm_email : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
    source: typeof body.source === "string" ? body.source : undefined,
  });
  if (!res.ok) return NextResponse.json({ error: res.error, blockers: res.blockers }, { status: res.status });
  return NextResponse.json({ ok: true, scheduled_for: res.scheduled_for });
}

export async function DELETE(req: Request) {
  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, cancelled: await cancelDeletion(user) });
}
