import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { storeMediaFile } from "@/lib/media/upload";

export const maxDuration = 60;

/**
 * Upload one file (multipart field "file") into the caller's site media
 * library. Web cookie session or mobile Bearer + X-Tenant-Id. Same guards and
 * photo optimisation as the dashboard media library.
 */
export async function POST(req: Request) {
  const caller = await getApiCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(caller.tenantId))) return NextResponse.json({ error: "Your role can't upload files on this site." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const r = await storeMediaFile(await createAdminClient(), caller.tenantId, file);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ media: r });
}
