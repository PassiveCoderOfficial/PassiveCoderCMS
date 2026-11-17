import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { appendItems } from "@/lib/import/run";

/** Append a chunk of browser-parsed items to a job that hasn't started yet. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await importAccess("write");
  if ("error" in access) return access.error;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.items)) return NextResponse.json({ error: "items required" }, { status: 400 });
  const r = await appendItems(access, (await params).id, body.items);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r);
}
