"use server";

import { auth } from "@clerk/nextjs/server";
import { getDecksByClerkUserId, getUser, upsertDeck, uupdateTitle } from "@/database";
import { ULID, ulid } from "ulid";
import { Unit } from "@/domain/types";

// クライアントコンポーネントの useQuery に渡すためのラッパー
export async function getDecksAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return getDecksByClerkUserId(userId);
}

export async function saveDecksAction({
  short,
  title,
  ...unit
}: Unit & { short?: ULID; title?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { id } = await getUser(userId);

  return upsertDeck({ short: short || ulid(), unit, userId: id, title });
}

export async function updateTitleAction({ short, title }: { short: ULID; title: string }) {
  return uupdateTitle(short, title);
}
