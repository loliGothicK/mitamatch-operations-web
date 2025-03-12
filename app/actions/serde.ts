'use server';
// biome-ignore lint/correctness/noNodejsModules: This is a Next.js API route, so we need to use the default Node.js import syntax
import crypto from 'node:crypto';

import { drizzle } from 'drizzle-orm/neon-http';
import { decks, timelines } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decodeDeck, decodeTimeline } from '@/encode_decode/serde';
import type { Unit } from '@/domain/types';
import type { OrderWithPic } from '@/jotai/orderAtoms';
import { match } from 'ts-pattern';

// biome-ignore lint/style/noNonNullAssertion: We know this environment variable is set
const db = drizzle(process.env.DATABASE_URL!);

export async function generateShortLink(data: { full: string }) {
  return await (async () =>
    crypto.createHash('md5').update(data.full).digest('hex'))();
}

// biome-ignore lint/suspicious/useAwait: server functions must use await
export async function saveShortLink({
  target,
  full,
  short,
}: { target: 'deck' | 'timeline'; full: string; short: string }) {
  if (target === 'deck') {
    const deck: typeof decks.$inferInsert = {
      full,
      short,
    };
    return db.insert(decks).values(deck);
  }
  const timeline: typeof timelines.$inferInsert = {
    full,
    short,
  };
  return db.insert(timelines).values(timeline);
}
export async function restore(_: {
  target: 'deck';
  short: string;
}): Promise<Unit>;
export async function restore(_: {
  target: 'timeline';
  short: string;
}): Promise<OrderWithPic[]>;
export async function restore({
  target,
  short,
}: {
  target: 'deck' | 'timeline';
  short: string;
}): Promise<Unit | OrderWithPic[]> {
  const base64 = await (async () => {
    if (target === 'deck') {
      const deck = await db
        .select({
          full: decks.full,
        })
        .from(decks)
        .where(eq(decks.short, short));
      if (deck.length === 1) {
        return deck[0].full;
      }
      return short;
    } else {
      const timeline = await db
        .select({
          full: timelines.full,
        })
        .from(timelines)
        .where(eq(timelines.short, short));
      if (timeline.length === 1) {
        return timeline[0].full;
      }
      return short;
    }
  })();
  return match(target)
    .with('deck', () => decodeDeck(base64)._unsafeUnwrap())
    .with('timeline', () => decodeTimeline(base64)._unsafeUnwrap())
    .exhaustive();
}
