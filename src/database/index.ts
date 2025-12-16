import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { decks, organization, organizationMembers, timelines, users } from "@/database/schema";
import { eq, inArray } from "drizzle-orm";
import { User } from "@clerk/backend";

const sql = neon(process.env.POSTGRES_URL!);
const db = drizzle({ client: sql });

export async function upsertUser(user: User) {
  if (!user) return undefined;

  const result = await db
    .insert(users)
    .values({
      clerkUserId: user.id,
      name: user.username!,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        name: user.username!,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return result[0];
}

export async function getUser(clerkUserId: string) {
  const result = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId));

  return result[0];
}

export async function getUserData(clerkUserId: string) {
  const user = await getUser(clerkUserId);

  // 1. まずユーザーの所属組織一覧を取得（元のクエリ）
  const legions = await db
    .select({
      id: organization.id,
      name: organization.name,
      role: organizationMembers.role,
    })
    .from(users)
    .innerJoin(organizationMembers, eq(users.id, organizationMembers.userId))
    .innerJoin(organization, eq(organizationMembers.organizationId, organization.id))
    .where(eq(users.clerkUserId, clerkUserId));

  // 2. role が 'org:admin' である組織のIDだけを抽出
  const adminOrgIds = legions.filter((l) => l.role === "org:admin").map((l) => l.id);

  // 3. 管理者権限を持つ組織のメンバーを一括取得するためのマップを作成
  const membersByOrgId = new Map<string, Array<{ userId: string; name: string; role: string }>>();

  if (adminOrgIds.length > 0) {
    // 該当する組織のメンバーをまとめて取得（1回のクエリで済ませる）
    const members = await db
      .select({
        orgId: organizationMembers.organizationId,
        userId: users.id,
        name: users.name,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(inArray(organizationMembers.organizationId, adminOrgIds));

    // 取得したメンバーを組織IDごとにグループ化
    for (const m of members) {
      const list = membersByOrgId.get(m.orgId) || [];
      list.push({ userId: m.userId, name: m.name, role: m.role });
      membersByOrgId.set(m.orgId, list);
    }
  }

  // 4. 元の結果にマージして返す
  const legionsWithMembers = legions.map((legion) => {
    // adminならメンバーリストを付与、そうでなければ undefined
    return {
      ...legion,
      members: legion.role === "org:admin" ? (membersByOrgId.get(legion.id) ?? []) : undefined,
    };
  });

  return {
    user,
    legions: legionsWithMembers,
  };
}

// デッキの短縮URLがDBに存在する場合、デッキのフルURLを取得する
export async function getDeckFullUrl(short: string) {
  const result = await db.select().from(decks).where(eq(decks.short, short));

  if (result.length === 0) {
    return null;
  }

  return result[0].full;
}

// タイムラインの短縮URLがDBに存在する場合、タイムラインのフルURLを取得する
export async function getTimelineFullUrl(short: string) {
  const result = await db.select().from(timelines).where(eq(timelines.short, short));

  if (result.length === 0) {
    return null;
  }

  return result[0].full;
}

export function upsertDeck(create: {
  short: string;
  full: string;
  userId?: string; // ログインしている場合のみ存在
}) {
  const now = new Date();

  if (create.userId) {
    // ユーザーがログインしている場合：insertしてconflictしたらuserIdを更新
    return db
      .insert(decks)
      .values({
        short: create.short,
        full: create.full,
        userId: create.userId,
        updatedAt: now.toISOString(),
      })
      .onConflictDoUpdate({
        target: decks.short,
        set: { userId: create.userId, updatedAt: now.toISOString() },
      })
      .returning({
        id: decks.id,
      });
  }
  // ログインしていない場合：insertしてconflictしても何も更新しない
  return db
    .insert(decks)
    .values({
      short: create.short,
      full: create.full,
      updatedAt: now.toISOString(),
    })
    .onConflictDoNothing({ target: decks.short })
    .returning({
      id: decks.id,
    });
}

export function upsertTimeline(create: {
  short: string;
  full: string;
  userId?: string; // ログインしている場合のみ存在
}) {
  const now = new Date();

  if (create.userId) {
    // ユーザーがログインしている場合：insertしてconflictしたらuserIdを更新
    return db
      .insert(timelines)
      .values({
        short: create.short,
        full: create.full,
        userId: create.userId,
        updatedAt: now.toISOString(),
      })
      .onConflictDoUpdate({
        target: timelines.short,
        set: { userId: create.userId, updatedAt: now.toISOString() },
      })
      .returning({
        id: timelines.id,
      });
  }
  // ログインしていない場合：insertしてconflictしても何も更新しない
  return db
    .insert(timelines)
    .values({
      short: create.short,
      full: create.full,
      updatedAt: now.toISOString(),
    })
    .onConflictDoNothing({ target: timelines.short })
    .returning({
      id: timelines.id,
    });
}
