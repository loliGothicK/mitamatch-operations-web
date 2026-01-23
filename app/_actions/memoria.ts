"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteMemoria, getMemoriaByUserId, getUser, upsertMemoria } from "@/database";

// クライアントコンポーネントの useQuery に渡すためのラッパー
export async function getListAction() {
  const { userId } = await auth();
  if (!userId) return [];
  const { id } = await getUser(userId);

  return getMemoriaByUserId(id);
}

export async function updateMemoriaAction({
  update,
  remove,
}: {
  update: { id: string; limitBreak: number }[];
  remove: { id: string; limitBreak: number }[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getUser(userId);

  await upsertMemoria(user.id, update);
  await deleteMemoria(user.id, remove);
}
