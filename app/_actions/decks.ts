"use server";

import { auth } from "@clerk/nextjs/server";
import { getDecksByClerkUserId, getUser, upsertDeck } from "@/database";
import { ulid } from "ulid";
import { Unit } from "@/domain/types";

// クライアントコンポーネントの useQuery に渡すためのラッパー
export async function getDecksAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return getDecksByClerkUserId(userId);
}

export async function saveDecksAction({ title, ...unit }: Unit & { title?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { id } = await getUser(userId);
  const short = ulid();

  return upsertDeck({ short, unit, userId: id, title });
}
