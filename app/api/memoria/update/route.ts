"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { upsertMemoria } from "@/database";
import { z } from "zod";

const targetsSchema = z.array(
  z.object({
    memoriaId: z.ulid().readonly(),
    limitBreak: z.number().min(0).max(4).readonly(),
  }),
);

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const targetsJson = searchParams.get("targets");
  if (!userId || !targetsJson) {
    return NextResponse.json({});
  }
  const targets = targetsSchema.parse(JSON.parse(targetsJson));
  const list = await upsertMemoria(userId, targets);
  return NextResponse.json({
    list,
  });
}
