"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getTimelinesByClerkUserId,
  getUser,
  upsertTimeline,
  updateTimelineTitle,
  deleteTimeline,
} from "@/database";
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
  title,
}: {
  timeline: OrderWithPic[];
  short?: ULID;
  title?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { id } = await getUser(userId);

  return upsertTimeline({ short: short || ulid(), timeline, userId: id, title });
}

export async function updateTimelineTitleAction({ short, title }: { short: ULID; title: string }) {
  return updateTimelineTitle(short, title);
}

export async function deleteTimelinesAction({ short }: { short: ULID }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { id } = await getUser(userId);

  return deleteTimeline(short, id);
}
