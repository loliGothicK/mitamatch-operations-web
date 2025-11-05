"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { restore } from "@/actions/restore";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const param = searchParams.get("deck");
  if (param === null) {
    return NextResponse.json({});
  }
  const timeline = await restore({ target: "timeline", param });
  return NextResponse.json({
    timeline: timeline.map((item) => item.name),
  });
}
