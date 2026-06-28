import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Agent signup is currently unavailable" }, { status: 403 });
}
