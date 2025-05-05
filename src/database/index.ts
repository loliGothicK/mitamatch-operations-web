import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { decks, timelines, users } from '@/database/schema';
import { eq } from 'drizzle-orm';

// biome-ignore lint/style/noNonNullAssertion:
const sql = neon(process.env.POSTGRES_URL!);
const db = drizzle({ client: sql });

export async function getUser(discordId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId));

  return result[0];
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
  const result = await db
    .select()
    .from(timelines)
    .where(eq(timelines.short, short));

  if (result.length === 0) {
    return null;
  }

  return result[0].full;
}

export function updateToken(update: {
  discordId: string;
  accessToken: string;
  refreshToken: string;
}) {
  const now = new Date();

  return db
    .update(users)
    .set({
      accessToken: update.accessToken,
      refreshToken: update.refreshToken,
      updatedAt: now.toISOString(),
    })
    .where(eq(users.discordId, update.discordId))
    .returning({
      id: users.id,
    });
}

export function upsertUser(create: {
  discordId: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
  refreshToken: string;
}) {
  const now = new Date();

  return db
    .insert(users)
    .values({
      discordId: create.discordId,
      email: create.email,
      name: create.name,
      avatar: create.avatar,
      accessToken: create.accessToken,
      refreshToken: create.refreshToken,
      updatedAt: now.toISOString(),
    })
    .onConflictDoUpdate({
      target: users.discordId,
      set: { updatedAt: now.toISOString() },
    })
    .returning({
      id: users.id,
    });
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
