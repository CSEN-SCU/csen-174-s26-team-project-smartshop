import { NextResponse } from "next/server";
import { getSessionUserFromCookies } from "@/lib/session";

export async function GET() {
  const user = getSessionUserFromCookies();
  return NextResponse.json({ user });
}
