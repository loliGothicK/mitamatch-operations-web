"use server";

import { auth } from "@clerk/nextjs/server";
import {
  deleteQueryPreset,
  getQueryPresetsByClerkUserId,
  getUser,
  upsertQueryPreset,
} from "@/database";

export async function getQueryPresetsAction() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return getQueryPresetsByClerkUserId(userId);
}

export async function saveQueryPresetAction(input: {
  id?: string;
  title: string;
  query: string;
  ownedOnly: boolean;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await getUser(userId);
  return upsertQueryPreset({
    ...input,
    userId: user.id,
  });
}

export async function deleteQueryPresetAction(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await getUser(userId);
  return deleteQueryPreset(id, user.id);
}
