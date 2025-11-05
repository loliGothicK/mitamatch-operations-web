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
  const unit = await restore({ target: "deck", param });
  return NextResponse.json({
    legendary: unit.legendaryDeck.map((memoria) => memoria.name.short),
    deck: unit.deck.map((memoria) => memoria.name.short),
  });
}
