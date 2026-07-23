"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteOrder, getOrdersByUserId, getUser, upsertOrder, getUserData } from "@/database";

export async function getOrderListAction(targetUserId?: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return [];
  const { id: internalUserId } = await getUser(clerkUserId);

  const fetchId = targetUserId ?? internalUserId;

  if (fetchId !== internalUserId) {
    const callerData = await getUserData(clerkUserId);
    const isAdmin = callerData.legions.some(
      (l) => l.role === "org:admin" && l.members && l.members.some((m) => m.userId === fetchId),
    );
    if (!isAdmin) throw new Error("Forbidden: Not an admin of a shared legion");
  }

  return getOrdersByUserId(fetchId);
}

export async function updateOrderAction({
  update,
  remove,
}: {
  update: number[];
  remove: number[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getUser(userId);

  await upsertOrder(user.id, update);
  await deleteOrder(user.id, remove);
}
