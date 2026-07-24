"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db, getUserData } from "@/database";
import { organization, organizationInvites, organizationMembers, users } from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ユーザーがAdminであるかチェック
async function requireLegionAdmin(legionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const userData = await getUserData(userId);
  const legion = userData.legions.find((l) => l.id === legionId);

  if (!legion) throw new Error("Legion not found");
  if (legion.role !== "org:admin") throw new Error("Forbidden: Requires admin role");

  return userData.user;
}

export async function inviteUserAction(legionId: string, targetInternalUserId: string) {
  await requireLegionAdmin(legionId);

  const targetUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, targetInternalUserId))
    .limit(1);

  if (targetUser.length === 0) {
    throw new Error("User not found");
  }

  await db.insert(organizationInvites).values({
    organizationId: legionId,
    userId: targetInternalUserId,
    status: "pending",
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function inviteUsersByUsernameAction(legionId: string, usernames: string[]) {
  await requireLegionAdmin(legionId);
  if (usernames.length === 0) return { success: true, results: [] };

  const client = await clerkClient();
  const results = [];

  for (const username of usernames) {
    try {
      // 1. Fetch user from Clerk by username
      const clerkUsers = await client.users.getUserList({ username: [username] });
      if (clerkUsers.data.length === 0) {
        results.push({ username, success: false, error: "Clerk user not found" });
        continue;
      }
      const targetClerkUserId = clerkUsers.data[0].id;

      // 2. Map to internal user
      const internalUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, targetClerkUserId))
        .limit(1);

      if (internalUsers.length === 0) {
        results.push({
          username,
          success: false,
          error: "User has not registered in this app yet",
        });
        continue;
      }
      const targetInternalUserId = internalUsers[0].id;

      // 3. Check if already a member
      const existingMembers = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, legionId),
            eq(organizationMembers.userId, targetInternalUserId),
          ),
        )
        .limit(1);

      if (existingMembers.length > 0) {
        results.push({
          username,
          success: false,
          error: "User is already a member of this legion",
        });
        continue;
      }

      // 4. Check if already invited
      const existingInvites = await db
        .select()
        .from(organizationInvites)
        .where(
          and(
            eq(organizationInvites.organizationId, legionId),
            eq(organizationInvites.userId, targetInternalUserId),
            eq(organizationInvites.status, "pending"),
          ),
        )
        .limit(1);

      if (existingInvites.length > 0) {
        results.push({ username, success: false, error: "User is already invited" });
        continue;
      }

      // 5. Create invite
      await db
        .insert(organizationInvites)
        .values({
          organizationId: legionId,
          userId: targetInternalUserId,
          status: "pending",
          updatedAt: new Date().toISOString(),
        })
        .returning();

      results.push({ username, success: true });
    } catch (e: any) {
      results.push({ username, success: false, error: e.message });
    }
  }

  return { success: true, results };
}

export async function getPendingInvitesAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const internalUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (internalUser.length === 0) return [];

  return await db
    .select({
      id: organizationInvites.id,
      organizationId: organization.id,
      organizationName: organization.name,
      createdAt: organizationInvites.createdAt,
    })
    .from(organizationInvites)
    .innerJoin(organization, eq(organization.id, organizationInvites.organizationId))
    .where(
      and(
        eq(organizationInvites.userId, internalUser[0].id),
        eq(organizationInvites.status, "pending"),
      ),
    );
}

export async function acceptInviteAction(inviteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const internalUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (!internalUser.length) throw new Error("User not found");

  const invite = await db
    .select()
    .from(organizationInvites)
    .where(
      and(eq(organizationInvites.id, inviteId), eq(organizationInvites.userId, internalUser[0].id)),
    )
    .limit(1);

  if (!invite.length) throw new Error("Invite not found");

  await db
    .update(organizationInvites)
    .set({ status: "accepted" })
    .where(eq(organizationInvites.id, inviteId))
    .returning();

  await db
    .insert(organizationMembers)
    .values({
      organizationId: invite[0].organizationId,
      userId: internalUser[0].id,
      role: "org:member",
    })
    .returning();

  revalidatePath("/");
  return { success: true };
}

export async function declineInviteAction(inviteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const internalUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (!internalUser.length) throw new Error("User not found");

  await db
    .update(organizationInvites)
    .set({ status: "declined" })
    .where(
      and(eq(organizationInvites.id, inviteId), eq(organizationInvites.userId, internalUser[0].id)),
    );

  revalidatePath("/");
  return { success: true };
}
