import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  decks,
  memoria,
  organization,
  organizationMembers,
  timelines,
  users,
  usersToMemoria,
} from "@/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { Unit } from "@/domain/types";
import { OrderWithPic } from "@/jotai/orderAtoms";
import { sql } from "drizzle-orm";

const db = drizzle({
  client: neon(
    process.env.NODE_ENV === "development"
      ? process.env.POSTGRES_DEVELOP_BRANCH_URL!
      : process.env.POSTGRES_URL!,
  ),
});

export async function upsertUser(user: { id: string; username: string | null } | undefined) {
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

export async function getMemoriaByUserId(userId: string) {
  return db
    .select({
      id: memoria.id,
      name: memoria.name,
      limitBreak: usersToMemoria.limitBreak,
    })
    .from(usersToMemoria)
    .where(eq(usersToMemoria.userId, userId))
    .innerJoin(memoria, eq(usersToMemoria.memoriaId, memoria.id));
}

export async function upsertMemoria(userId: string, targets: { id: string; limitBreak: number }[]) {
  if (targets.length === 0) return;

  return db
    .insert(usersToMemoria)
    .values(targets.map(({ id, limitBreak }) => ({ userId, memoriaId: id, limitBreak })))
    .onConflictDoUpdate({
      target: [usersToMemoria.userId, usersToMemoria.memoriaId],
      set: {
        limitBreak: sql`excluded.limit_break`,
      },
    });
}

export async function deleteMemoria(userId: string, targets: { id: string; limitBreak: number }[]) {
  if (targets.length === 0) return;

  const targetIds = targets.map((t) => t.id);

  return db
    .delete(usersToMemoria)
    .where(and(eq(usersToMemoria.userId, userId), inArray(usersToMemoria.memoriaId, targetIds)));
}

export async function getDecksByClerkUserId(clerkUserId: string) {
  const user = await getUser(clerkUserId);

  return db
    .select({
      title: decks.title,
      unit: decks.unit,
    })
    .from(decks)
    .where(eq(decks.userId, user.id));
}

export async function getTimelinesByClerkUserId(clerkUserId: string) {
  const user = await getUser(clerkUserId);

  return db
    .select({
      title: timelines.title,
      timeline: timelines.timeline,
    })
    .from(timelines)
    .where(eq(timelines.userId, user.id))
    .then((result) =>
      result.map((r) => ({
        title: r.title,
        timeline: r.timeline.timeline,
      })),
    );
}

// デッキの短縮URLがDBに存在する場合、デッキのフルURLを取得する
export async function getDeckFullUrl(short: string) {
  const result = await db.select().from(decks).where(eq(decks.short, short));

  if (result.length === 0) {
    return null;
  }

  return result[0].unit;
}

// タイムラインの短縮URLがDBに存在する場合、タイムラインのフルURLを取得する
export async function getTimelineFullUrl(short: string) {
  const result = await db.select().from(timelines).where(eq(timelines.short, short));

  if (result.length === 0) {
    return null;
  }

  return result[0].timeline.timeline;
}

export function upsertDeck(create: {
  short: string;
  unit: Unit;
  title?: string;
  userId?: string; // ログインしている場合のみ存在
}) {
  const now = new Date();

  return db
    .insert(decks)
    .values({
      short: create.short,
      unit: create.unit,
      userId: create.userId,
      title: create.title,
      updatedAt: now.toISOString(),
    })
    .onConflictDoUpdate({
      target: [
        decks.short,
        decks.userId,
      ],
      set: {
        title: create.title,
        unit: create.unit,
        userId: create.userId,
        updatedAt: now.toISOString(),
      },
    })
    .returning({
      id: decks.id,
    });
}

export function upsertTimeline(create: {
  short: string;
  timeline: OrderWithPic[];
  userId?: string; // ログインしている場合のみ存在
}) {
  const now = new Date();

  return db
    .insert(timelines)
    .values({
      short: create.short,
      timeline: { timeline: create.timeline },
      userId: create.userId,
      updatedAt: now.toISOString(),
    })
    .onConflictDoUpdate({
      target: timelines.short,
      set: {
        userId: create.userId,
        timeline: { timeline: create.timeline },
        updatedAt: now.toISOString(),
      },
    })
    .returning({
      id: timelines.id,
    });
}
