"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMemoriaByUserId } from "@/database";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const param = searchParams.get("userId");
  if (param === null) {
    return NextResponse.json({});
  }
  const list = await getMemoriaByUserId(param);
  return NextResponse.json({
    list,
  });
}
