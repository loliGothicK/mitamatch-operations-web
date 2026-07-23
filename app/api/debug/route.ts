import { db } from "@/database";
import { organizationInvites } from "@/database/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const invites = await db.select().from(organizationInvites);
  return NextResponse.json({ invites });
}
