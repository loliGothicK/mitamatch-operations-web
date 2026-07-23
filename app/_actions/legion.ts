"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserData, getLegionMemberMemoria, getLegionMemberOrders, db } from "@/database";
import { organization, organizationMembers, users } from "@/database/schema";
import { eq } from "drizzle-orm";

// Helper to check if the user is an admin of the specified legion
async function requireLegionAdmin(legionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const userData = await getUserData(userId);
  const legion = userData.legions.find((l) => l.id === legionId);

  if (!legion) throw new Error("Legion not found");
  if (legion.role !== "org:admin") throw new Error("Forbidden: Requires admin role");

  return userData.user;
}

export async function getLegionMemberMemoriaAction(legionId: string) {
  await requireLegionAdmin(legionId);
  return getLegionMemberMemoria(legionId);
}

export async function getLegionMemberOrdersAction(legionId: string) {
  await requireLegionAdmin(legionId);
  return getLegionMemberOrders(legionId);
}

export async function createLegionAction(name: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  // Get internal user id
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!user.length) throw new Error("User not found in database");
  const internalUserId = user[0].id;

  const newOrg = await db.insert(organization).values({ name }).returning({ id: organization.id });

  if (!newOrg.length) throw new Error("Failed to create organization");
  const orgId = newOrg[0].id;

  await db.insert(organizationMembers).values({
    organizationId: orgId,
    userId: internalUserId,
    role: "org:admin",
  });

  return orgId;
}
