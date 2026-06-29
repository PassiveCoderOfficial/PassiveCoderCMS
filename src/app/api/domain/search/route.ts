import { NextResponse } from "next/server";
import { searchDomains } from "@/lib/domain/logicbox";

const TLDS = ["com", "net", "org", "io", "co", "app", "dev"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  // Strip TLD if user typed one
  const baseName = q.replace(/\.[a-z]{2,}$/, "").replace(/[^a-z0-9-]/g, "-");

  try {
    const results = await searchDomains([baseName], TLDS);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Domain search error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    const debug = process.env.DOMAIN_DEBUG === "1";
    return NextResponse.json(
      { error: "Domain search unavailable", ...(debug && { detail, proxy: !!process.env.LOGICBOX_PROXY_URL, hasUser: !!process.env.LOGICBOX_USER_ID }) },
      { status: 503 },
    );
  }
}
