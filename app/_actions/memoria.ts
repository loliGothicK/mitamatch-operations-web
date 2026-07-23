"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteMemoria, getMemoriaByUserId, getUser, upsertMemoria } from "@/database";

import { getUserData } from "@/database";

// クライアントコンポーネントの useQuery に渡すためのラッパー
export async function getListAction(targetUserId?: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return [];
  const { id: internalUserId } = await getUser(clerkUserId);

  const fetchId = targetUserId ?? internalUserId;

  if (fetchId !== internalUserId) {
    const callerData = await getUserData(clerkUserId);
    // Check if there's any common legion where caller is admin
    const isAdmin = callerData.legions.some(l => 
      l.role === "org:admin" && l.members && l.members.some(m => m.userId === fetchId)
    );
    if (!isAdmin) throw new Error("Forbidden: Not an admin of a shared legion");
  }

  return getMemoriaByUserId(fetchId);
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
