'use server';
import type { Unit } from '@/domain/types';
import { match } from 'ts-pattern';
import { decodeDeck, decodeTimeline } from '@/encode_decode/serde';
import type { Order } from '@/domain/order/order';
import { prisma } from '@/database/prismaClient';

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
  const parseResult = match(target)
    .with('deck', () => decodeDeck(param))
    .with('timeline', () => decodeTimeline(param))
    .exhaustive();

  if (parseResult.isOk()) {
    return parseResult.value;
  }
    const { full } = await match(target)
      .with('deck', async () => {
        return (
          (await prisma.deck.findFirst({
            where: { short: param },
            select: { full: true },
          })) || { full: param }
        );
      })
      .with('timeline', async () => {
        return (
          (await prisma.timeline.findFirst({
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
