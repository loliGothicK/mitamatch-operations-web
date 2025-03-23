import type { Unit } from '@/domain/types';
import { match } from 'ts-pattern';
import { decodeDeck, decodeTimeline } from '@/encode_decode/serde';
import type { Order } from '@/domain/order/order';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

type OrderWithPic = Order & {
  delay?: number;
  pic?: string;
  sub?: string;
};

export async function restore(_: {
  target: 'deck';
  param: string;
}): Promise<Unit>;
export async function restore(_: {
  target: 'timeline';
  param: string;
}): Promise<OrderWithPic[]>;
export async function restore({
  target,
  param,
}: {
  target: 'deck' | 'timeline';
  param: string;
}): Promise<Unit | OrderWithPic[]> {
  const { full } = await match(target)
    .with('deck', async () => {
      return (
        (await prisma.deck.findUnique({
          where: { short: param },
          select: { full: true },
        })) || { full: param }
      );
    })
    .with('timeline', async () => {
      return (
        (await prisma.timeline.findUnique({
          where: { short: param },
          select: { full: true },
        })) || { full: param }
      );
    })
    .exhaustive();
  return match(target)
    .with('deck', () => decodeDeck(full)._unsafeUnwrap())
    .with('timeline', () => decodeTimeline(full)._unsafeUnwrap())
    .exhaustive();
}
