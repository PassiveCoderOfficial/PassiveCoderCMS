import { NextResponse } from "next/server";
import { AGENT_VIEWING_COOKIE } from "@/lib/tenant/current";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/agent/sites", req.url));
  res.cookies.set(AGENT_VIEWING_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
