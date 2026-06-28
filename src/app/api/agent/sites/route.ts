import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Agent portal is currently unavailable" }, { status: 403 });
}
