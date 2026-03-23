"use server";

import { auth } from "@clerk/nextjs/server";
import { getTimelinesByClerkUserId, getUser, upsertTimeline } from "@/database";
import { ulid, ULID } from "ulid";
import { OrderWithPic } from "@/jotai/orderAtoms";

// クライアントコンポーネントの useQuery に渡すためのラッパー
export async function getTimelinesAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return getTimelinesByClerkUserId(userId);
}

export async function saveTimelinesAction({
  timeline,
  short,
}: {
  timeline: OrderWithPic[];
  short?: ULID;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { id } = await getUser(userId);

  return upsertTimeline({ short: short || ulid(), timeline, userId: id });
}
