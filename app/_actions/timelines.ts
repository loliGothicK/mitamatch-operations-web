"use server";

import { auth } from "@clerk/nextjs/server";
import { getTimelinesByClerkUserId } from "@/database";

// クライアントコンポーネントの useQuery に渡すためのラッパー
export async function getTimelinesAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return getTimelinesByClerkUserId(userId);
}
