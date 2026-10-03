import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { runJobStep } from "@/lib/import/run";

export const maxDuration = 60;

/** Process the next batch of an import; the page calls this until "done". */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await importAccess("write");
  if ("error" in access) return access.error;
  const r = await runJobStep(access, (await params).id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(r);
}
