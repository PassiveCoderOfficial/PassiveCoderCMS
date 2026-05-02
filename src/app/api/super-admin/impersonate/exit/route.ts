import { NextResponse } from "next/server";
import { SA_VIEWING_COOKIE } from "@/lib/tenant/current";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SA_VIEWING_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(SA_VIEWING_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
